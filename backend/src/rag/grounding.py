"""Build the grounding prompt block from retrieved chunks.

Each chunk becomes:

    <research_chunk id="N" paper="..." section="...">
    {content}
    </research_chunk>

Chunks are assigned sequential ids starting at 1 — shared across papers —
so the LLM can cite with `[N]` in a flat namespace. Paper title and section
are attribute-escaped to protect the outer XML-ish frame; chunk content is
placed verbatim inside the tag body (the system prompt instructs the model
to treat content between these tags as data, never as instructions).
"""
from __future__ import annotations

from dataclasses import dataclass
from html import escape

from src.rag.retriever import RetrievedChunk


@dataclass(frozen=True)
class GroundedChunk:
    """A retrieved chunk paired with its public citation id (1-based)."""

    id: int
    chunk: RetrievedChunk


@dataclass(frozen=True)
class Grounding:
    chunks: list[GroundedChunk]
    prompt_block: str


def _tag_open(
    chunk_id: int,
    paper_title: str,
    section: str | None,
) -> str:
    paper_attr = escape(paper_title, quote=True)
    parts = [f'id="{chunk_id}"', f'paper="{paper_attr}"']
    if section:
        section_attr = escape(section, quote=True)
        parts.append(f'section="{section_attr}"')
    return f"<research_chunk {' '.join(parts)}>"


def build_grounding_from_chunks(chunks: list[RetrievedChunk]) -> Grounding:
    if not chunks:
        return Grounding(chunks=[], prompt_block="")

    grounded: list[GroundedChunk] = []
    rendered_parts: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        grounded.append(GroundedChunk(id=i, chunk=chunk))
        rendered_parts.append(
            _tag_open(i, chunk.paper_title, chunk.section)
            + "\n"
            + chunk.content.strip()
            + "\n</research_chunk>"
        )

    return Grounding(chunks=grounded, prompt_block="\n\n".join(rendered_parts))
