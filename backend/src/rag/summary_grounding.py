"""Build a single broad retrieval for the mentor-summary endpoint.

Category-structured retrieval (8 × k=2) pre-commits to a rubric that may
not match the actual conversation, dilutes attention, and makes citation
numbering fragile. One broader retrieval over the conversation theme
lets the model weight evidence itself.

This path is only active in `RagMode.FULL` — `MENTOR_ONLY` leaves the
summary untouched (flag gate lets us ship chat grounding first).
"""
from __future__ import annotations

import structlog
from asyncpg import Connection

from src.core.config import RagMode, settings
from src.rag.grounding import Grounding, build_grounding_from_chunks
from src.rag.retriever import retrieve

log = structlog.get_logger(__name__)

_MAX_QUERY_CHARS: int = 800


def build_summary_query(*, profile_one_liner: str, transcripts: str) -> str:
    """Compose a retrieval query from the founder's profile + recent transcript.

    Deliberately deterministic — no LLM-based query rewriting at this stage.
    """
    pieces: list[str] = []
    if profile_one_liner.strip():
        pieces.append(profile_one_liner.strip())

    # Use only the first N characters of flattened transcripts to stay well
    # under the query char budget + keep latency predictable.
    excerpt = transcripts.strip()[:600]
    if excerpt:
        pieces.append(excerpt)

    pieces.append(
        "founder evaluation predictors of startup success entrepreneurship signals"
    )

    q = " \n ".join(pieces)
    return q[:_MAX_QUERY_CHARS]


async def build_summary_grounding(
    *,
    profile_one_liner: str,
    transcripts: str,
    conn: Connection | None,
    k: int = 8,
    min_score: float = 0.25,
) -> Grounding:
    if settings.rag_mode is not RagMode.FULL:
        return Grounding(chunks=[], prompt_block="")
    if not settings.openai_api_key or conn is None:
        return Grounding(chunks=[], prompt_block="")

    query = build_summary_query(
        profile_one_liner=profile_one_liner, transcripts=transcripts
    )
    if not query.strip():
        return Grounding(chunks=[], prompt_block="")

    try:
        chunks = await retrieve(query, k=k, min_score=min_score, conn=conn)
    except Exception:
        log.exception("rag_retrieve_failed_in_summary")
        return Grounding(chunks=[], prompt_block="")

    return build_grounding_from_chunks(chunks)
