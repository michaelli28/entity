"""API response schema for citations.

The snippet cap lives in the validator so no code path — retriever,
extractor, handler, middleware — can smuggle a full chunk to the client.
This is the fair-use boundary.
"""
from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_SNIPPET_WORDS: int = 150


def _truncate(content: str, *, max_words: int) -> str:
    words = content.split()
    if len(words) <= max_words:
        return content.strip()
    truncated = " ".join(words[:max_words])
    last_period = truncated.rfind(".")
    if last_period >= int(len(truncated) * 0.6):
        return truncated[: last_period + 1].strip()
    return (truncated.rstrip(",;:") + "…").strip()


class Citation(BaseModel):
    """Public citation shape returned to clients.

    `snippet` is server-enforced to ≤MAX_SNIPPET_WORDS words, truncated on
    a sentence boundary when possible. Full chunk content is never returned.
    """

    model_config = ConfigDict(frozen=True)

    index: int = Field(ge=1)
    paper_id: UUID
    paper_title: str
    section: str | None = None
    snippet: str

    @field_validator("snippet", mode="before")
    @classmethod
    def _cap_snippet(cls, v: object) -> str:
        if not isinstance(v, str):
            raise TypeError("snippet must be a string")
        return _truncate(v, max_words=MAX_SNIPPET_WORDS)
