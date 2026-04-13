"""Tests for the token-aware chunker."""
from __future__ import annotations

import tiktoken

from src.rag.chunking import CHUNKING_VERSION, TOKENIZER_NAME, Chunk, chunk_section
from src.rag.parsing import Section


def _tokens(text: str) -> int:
    enc = tiktoken.get_encoding(TOKENIZER_NAME)
    return len(enc.encode(text))


def _make_section(words: int, heading: str | None = "Method") -> Section:
    # Repeating distinct numbered tokens so we can detect content loss.
    content = " ".join(f"word{i}" for i in range(words))
    return Section(heading=heading, content=content)


def test_tokenizer_is_o200k_base() -> None:
    assert TOKENIZER_NAME == "o200k_base"


def test_chunking_version_is_integer() -> None:
    assert isinstance(CHUNKING_VERSION, int)
    assert CHUNKING_VERSION >= 1


def test_short_section_fits_in_single_chunk() -> None:
    section = _make_section(words=20)
    chunks = chunk_section(section, target=1500, overlap=200)
    assert len(chunks) == 1
    assert chunks[0].token_count <= 1500
    assert chunks[0].heading == "Method"


def test_chunks_respect_target_tokens_within_tolerance() -> None:
    section = _make_section(words=4000)  # ~4000 tokens
    chunks = chunk_section(section, target=1500, overlap=200)

    assert len(chunks) > 1
    # Every non-final chunk must be close to target (allow ±target*0.2 tolerance).
    for c in chunks[:-1]:
        assert 1200 <= c.token_count <= 1700


def test_chunks_overlap_by_configured_amount() -> None:
    section = _make_section(words=4000)
    chunks = chunk_section(section, target=1500, overlap=200)

    assert len(chunks) >= 2
    enc = tiktoken.get_encoding(TOKENIZER_NAME)
    first_ids = enc.encode(chunks[0].content)
    second_ids = enc.encode(chunks[1].content)

    # The last N tokens of the first chunk should appear at the head of the second.
    tail = first_ids[-200:]
    assert second_ids[:200] == tail


def test_no_content_lost_across_chunks() -> None:
    section = _make_section(words=3000)
    chunks = chunk_section(section, target=1500, overlap=200)

    joined = " ".join(c.content for c in chunks)
    # Every original word (no dedup) must appear at least once in the joined output.
    for i in range(3000):
        assert f"word{i}" in joined


def test_chunks_are_indexed_sequentially() -> None:
    section = _make_section(words=4000)
    chunks = chunk_section(section, target=1500, overlap=200)
    indices = [c.chunk_index for c in chunks]
    assert indices == list(range(len(chunks)))


def test_chunk_heading_propagates_from_section() -> None:
    section = _make_section(words=4000, heading="Results")
    chunks = chunk_section(section, target=1500, overlap=200)
    assert all(c.heading == "Results" for c in chunks)


def test_chunk_dataclass_is_frozen() -> None:
    section = _make_section(words=20)
    chunks = chunk_section(section, target=1500, overlap=200)

    import pytest

    with pytest.raises((AttributeError, TypeError)):
        chunks[0].chunk_index = 99  # type: ignore[misc]


def test_empty_section_yields_no_chunks() -> None:
    section = Section(heading="Method", content="")
    chunks = chunk_section(section, target=1500, overlap=200)
    assert chunks == []


def test_chunks_expose_token_count() -> None:
    section = _make_section(words=100)
    chunks = chunk_section(section, target=1500, overlap=200)
    assert isinstance(chunks[0], Chunk)
    assert chunks[0].token_count == _tokens(chunks[0].content)
