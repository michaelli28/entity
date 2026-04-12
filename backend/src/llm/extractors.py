# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
from typing import Any

import instructor
from pydantic import BaseModel, Field

from .client import HAIKU_MODEL, SONNET_MODEL, get_client


class ColdRead(BaseModel):
    what_i_heard: str = Field(
        description="1-paragraph summary of what the founder said"
    )
    investor_pushback: list[str] = Field(
        description="3 specific pushbacks an investor would give in a first meeting",
        min_length=3,
        max_length=3,
    )
    three_unanswered_questions: list[str] = Field(
        description=(
            "3 specific questions the founder cannot yet answer but should be able to"
        ),
        min_length=3,
        max_length=3,
    )


class SessionSummary(BaseModel):
    key_facts: list[str] = Field(
        description="3-5 facts the mentor should remember next time"
    )
    founder_tone: str = Field(
        description=(
            "One of: confident, uncertain, defensive, energized, overwhelmed"
        )
    )
    topics_covered: list[str]
    open_threads: list[str] = Field(
        description="Things not yet resolved — good hooks for next session"
    )


class ExtractedSignal(BaseModel):
    key: str  # e.g., "mrr", "churn_rate", "team_size", "has_co_founder"
    value: str | int | float | bool | None
    confidence: float = Field(ge=0.0, le=1.0)


class ExtractedSignals(BaseModel):
    signals: list[ExtractedSignal]
    concerns_raised: list[str]
    claims_made: list[str]


_instructor_client: Any = None


def _get_instructor() -> Any:
    global _instructor_client
    if _instructor_client is None:
        _instructor_client = instructor.from_anthropic(
            get_client(), mode=instructor.Mode.ANTHROPIC_JSON
        )
    return _instructor_client


async def generate_cold_read(
    conversation_excerpt: str, founder_context: str
) -> ColdRead:
    client = _get_instructor()
    return await client.messages.create(
        model=SONNET_MODEL,
        max_tokens=1200,
        temperature=0.4,
        response_model=ColdRead,
        system=(
            "You are a seasoned VC giving a 'cold read' of a founder after a short "
            "conversation. Be specific, direct, and actionable. Cite concrete things "
            "the founder said. Do not be diplomatic — surface the sharpest pushback "
            "an investor would give.\n"
            f"Founder context:\n{founder_context}"
        ),
        messages=[
            {
                "role": "user",
                "content": f"Conversation excerpt:\n{conversation_excerpt}",
            }
        ],
    )


async def generate_session_summary(conversation_excerpt: str) -> SessionSummary:
    client = _get_instructor()
    return await client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=800,
        temperature=0.2,
        response_model=SessionSummary,
        system=(
            "Summarize a conversation between a startup mentor and a founder. "
            "Capture facts, tone, and open threads."
        ),
        messages=[{"role": "user", "content": conversation_excerpt}],
    )


async def extract_signals(founder_turn: str) -> ExtractedSignals:
    client = _get_instructor()
    return await client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=500,
        temperature=0.0,
        response_model=ExtractedSignals,
        system=(
            "Extract structured signals from a founder's turn in a mentorship "
            "conversation. Focus on quantifiable facts (MRR, team size, customers), "
            "claims, and concerns."
        ),
        messages=[{"role": "user", "content": founder_turn}],
    )
