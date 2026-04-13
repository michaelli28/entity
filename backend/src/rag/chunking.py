"""Token-aware chunker for research paper sections.

Targets ~1500 tokens per chunk with 200-token overlap. Academic prose needs
larger chunks than the 800-token defaults tuned for 4K-context models —
1500 preserves argumentative flow without bloating the model's prompt.

Uses `o200k_base` tokenizer, which is the correct pair for
OpenAI's `text-embedding-3-small` and gpt-4o family.

`CHUNKING_VERSION` bumps whenever target/overlap/tokenizer change. The
ingestion pipeline uses `(sha256, chunking_version)` as the idempotency key
so a version bump forces re-ingest of unchanged PDFs.
"""
from __future__ import annotations

from dataclasses import dataclass

import tiktoken

from .parsing import Section

CHUNKING_VERSION: int = 1
TOKENIZER_NAME: str = "o200k_base"


@dataclass(frozen=True)
class Chunk:
    chunk_index: int
    heading: str | None
    content: str
    token_count: int


def chunk_section(
    section: Section,
    *,
    target: int = 1500,
    overlap: int = 200,
) -> list[Chunk]:
    if not section.content.strip():
        return []

    enc = tiktoken.get_encoding(TOKENIZER_NAME)
    token_ids = enc.encode(section.content)

    if len(token_ids) <= target:
        return [
            Chunk(
                chunk_index=0,
                heading=section.heading,
                content=section.content,
                token_count=len(token_ids),
            )
        ]

    chunks: list[Chunk] = []
    step = target - overlap
    start = 0
    index = 0
    while start < len(token_ids):
        end = start + target
        window = token_ids[start:end]
        content = enc.decode(window)
        chunks.append(
            Chunk(
                chunk_index=index,
                heading=section.heading,
                content=content,
                token_count=len(window),
            )
        )
        if end >= len(token_ids):
            break
        start += step
        index += 1

    return chunks
