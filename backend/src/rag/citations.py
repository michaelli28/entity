"""Post-generation citation validator.

LLMs hallucinate citations. We extract every `[N]` token from the model's
output, drop any N that was not actually retrieved, and return a clean
`(text, citations)` pair that downstream code/frontends can trust.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from uuid import UUID

from src.rag.grounding import Grounding

_CITATION_RE = re.compile(r"\[(\d+)\]")
_MAX_SNIPPET_WORDS: int = 150


def _make_snippet(content: str, *, max_words: int = _MAX_SNIPPET_WORDS) -> str:
    """Cap content at ~max_words, truncating at last sentence boundary when possible."""
    words = content.split()
    if len(words) <= max_words:
        return content.strip()
    truncated = " ".join(words[:max_words])
    # Prefer ending at a sentence boundary within the truncated portion.
    last_period = truncated.rfind(".")
    if last_period >= int(len(truncated) * 0.6):
        return truncated[: last_period + 1].strip()
    return (truncated.rstrip(",;:") + "…").strip()


@dataclass(frozen=True)
class ValidatedCitation:
    index: int
    paper_id: UUID
    paper_title: str
    section: str | None
    snippet: str


def validate_citations(
    text: str,
    grounding: Grounding,
) -> tuple[str, list[ValidatedCitation]]:
    """Strip orphan `[N]` references, dedupe, and emit validated citations."""
    valid_ids = {gc.id: gc.chunk for gc in grounding.chunks}

    # Pass 1: strip orphan references from text (retaining surrounding spacing).
    def _replace(match: re.Match[str]) -> str:
        n = int(match.group(1))
        return match.group(0) if n in valid_ids else ""

    cleaned = _CITATION_RE.sub(_replace, text)
    # Collapse leftover double spaces caused by orphan removal.
    cleaned = re.sub(r"  +", " ", cleaned)
    cleaned = re.sub(r" +([.,;:!?])", r"\1", cleaned)

    # Pass 2: collect citations in first-appearance order.
    seen: set[int] = set()
    ordered: list[ValidatedCitation] = []
    for match in _CITATION_RE.finditer(cleaned):
        n = int(match.group(1))
        if n in seen or n not in valid_ids:
            continue
        seen.add(n)
        chunk = valid_ids[n]
        ordered.append(
            ValidatedCitation(
                index=n,
                paper_id=chunk.paper_id,
                paper_title=chunk.paper_title,
                section=chunk.section,
                snippet=_make_snippet(chunk.content),
            )
        )

    return cleaned, ordered
