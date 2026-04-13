# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
import json
from typing import Any

from asyncpg import Connection

from ..db.repositories import deck_repository as drepo
from ..db.repositories import mentor_repository as mrepo
from ..rag.grounding import Grounding
from . import prompts
from .client import build_cached_system
from .deck_extract import format_deck_summary_for_prompt
from .mentor_sessions import SessionBlueprint


async def _retrieve_patterns(
    conn: Connection, stage: str, limit: int = 5
) -> list[str]:
    rows = await conn.fetch(
        """
        SELECT description, source FROM founder_patterns
        WHERE $1 = ANY(applies_to_stages)
        ORDER BY CASE confidence_tier
            WHEN 'evidence_backed' THEN 1
            WHEN 'widely_accepted' THEN 2
            ELSE 3
        END
        LIMIT $2
        """,
        stage,
        limit,
    )
    return [
        f"{r['description']}"
        + (f" (source: {r['source']})" if r["source"] else "")
        for r in rows
    ]


async def _retrieve_benchmarks(conn: Connection, stage: str) -> list[str]:
    rows = await conn.fetch(
        "SELECT metric_key, metric_value FROM stage_benchmarks WHERE stage = $1",
        stage,
    )
    # metric_value is jsonb; asyncpg returns it as a JSON string by default.
    def _parse(v: Any) -> Any:
        return json.loads(v) if isinstance(v, str) else v

    return [f"{r['metric_key']}: {_parse(r['metric_value'])}" for r in rows]


async def build_messages_and_system(
    conn: Connection,
    *,
    founder: dict[str, Any],
    profile: dict[str, Any],
    blueprint: SessionBlueprint,
    session_id: Any,
    new_user_message: str,
    grounding: Grounding | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return (system_blocks_for_anthropic, messages_for_anthropic).

    system_blocks has cache_control on the first two (stable) blocks.
    """
    stage = profile.get("stage") or "pre_seed"
    patterns = await _retrieve_patterns(conn, stage)
    benchmarks = await _retrieve_benchmarks(conn, stage)

    identity = prompts.MENTOR_IDENTITY
    profile_block = prompts.founder_profile_block(founder, profile)
    retrieved = prompts.retrieved_context_block(
        patterns, benchmarks, rolling_summary=None
    )

    latest_deck = await drepo.latest_for_founder(conn, founder_id=founder["id"])
    deck_text = ""
    if latest_deck and latest_deck.get("extraction_status") == "done":
        sections = latest_deck.get("extracted_sections")
        if isinstance(sections, str):
            try:
                sections = json.loads(sections)
            except (ValueError, TypeError):
                sections = None
        if isinstance(sections, dict):
            deck_text = format_deck_summary_for_prompt(sections)

    blocks: list[tuple[str, bool]] = [
        (identity, True),
        (profile_block, True),
        (blueprint.system_suffix, False),
    ]
    if deck_text:
        blocks.append((deck_text, False))
    blocks.append((retrieved, False))
    if grounding is not None and grounding.prompt_block:
        blocks.append(
            (
                "Relevant research excerpts (cite with [N] matching id):\n"
                + grounding.prompt_block,
                False,
            )
        )
    system_blocks = build_cached_system(blocks)

    recent = await mrepo.recent_messages(conn, session_id, limit=20)
    messages: list[dict[str, Any]] = []
    for m in recent:
        role = "user" if m["role"] == "user" else "assistant"
        content = (
            m["content"]
            if role == "assistant"
            else f"<user_message>{m['content']}</user_message>"
        )
        messages.append({"role": role, "content": content})
    messages.append(
        {"role": "user", "content": f"<user_message>{new_user_message}</user_message>"}
    )

    return system_blocks, messages
