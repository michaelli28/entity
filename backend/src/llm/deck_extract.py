# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
import base64
import json
import re
from typing import Any

import structlog
from pydantic import BaseModel, Field

from .client import SONNET_MODEL, get_raw_anthropic_client

log = structlog.get_logger()


class DeckSections(BaseModel):
    one_liner: str | None = Field(default=None, description="The pitch in one sentence")
    problem: str | None = Field(default=None, description="The problem being solved")
    solution: str | None = Field(default=None, description="The product / approach")
    market: str | None = Field(default=None, description="TAM, ICP, market size claims")
    traction: str | None = Field(
        default=None, description="Users, revenue, LOIs, metrics"
    )
    team: str | None = Field(default=None, description="Founders, key hires")
    ask: str | None = Field(default=None, description="Round size, use of funds, terms")
    why_now: str | None = Field(default=None, description="Timing thesis")


async def extract_deck_sections(pdf_bytes: bytes) -> DeckSections:
    """Send the PDF to Claude and ask for structured sections. Never raises."""
    client = get_raw_anthropic_client()
    b64 = base64.standard_b64encode(pdf_bytes).decode("ascii")
    system = (
        "You are analyzing a startup pitch deck. Extract the following sections. "
        "If a section is not clearly present, return null — do NOT guess. "
        "Keep each section concise (1-3 sentences max)."
    )
    user_content: list[dict[str, Any]] = [
        {
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": b64,
            },
        },
        {
            "type": "text",
            "text": (
                "Extract the deck sections as JSON matching this schema: "
                "one_liner, problem, solution, market, traction, team, ask, why_now. "
                "Each field is a string or null. "
                "Respond with ONLY the JSON object, no commentary."
            ),
        },
    ]
    try:
        resp = await client.messages.create(
            model=SONNET_MODEL,
            max_tokens=1500,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
        text_blocks = [
            b.text for b in resp.content if getattr(b, "type", None) == "text"
        ]
        raw_text = "\n".join(text_blocks)
        match = re.search(r"\{.*\}", raw_text, flags=re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict):
                return DeckSections(**parsed)
        return DeckSections()
    except Exception:
        log.exception("deck_extract_failed")
        return DeckSections()


def format_deck_summary_for_prompt(sections: dict[str, Any]) -> str:
    """Render extracted deck sections as a compact block for the mentor system prompt."""
    order = (
        "one_liner",
        "problem",
        "solution",
        "market",
        "traction",
        "team",
        "ask",
        "why_now",
    )
    lines: list[str] = []
    for key in order:
        val = sections.get(key) if isinstance(sections, dict) else None
        if val:
            label = key.replace("_", " ").title()
            lines.append(f"- {label}: {val}")
    if not lines:
        return ""
    return "Founder's pitch deck (extracted):\n" + "\n".join(lines)
