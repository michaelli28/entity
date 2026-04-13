"""Tests for the Citation response schema.

The Pydantic validator is the last line of defence against redistributing
full chunks to clients: no code path can bypass the 150-word snippet cap.
"""
from __future__ import annotations

from uuid import uuid4

import pytest

from src.api.schemas.citations import MAX_SNIPPET_WORDS, Citation


def test_short_snippet_passes_through() -> None:
    c = Citation(
        index=1,
        paper_id=uuid4(),
        paper_title="A Paper",
        section="intro",
        snippet="A short sentence.",
    )
    assert c.snippet == "A short sentence."


def test_long_snippet_is_truncated_at_max_words() -> None:
    long_text = " ".join(f"word{i}." for i in range(500))
    c = Citation(
        index=1,
        paper_id=uuid4(),
        paper_title="A Paper",
        section=None,
        snippet=long_text,
    )
    assert len(c.snippet.split()) <= MAX_SNIPPET_WORDS


def test_snippet_prefers_sentence_boundary_truncation() -> None:
    # ~200 words of well-punctuated prose — truncation should end on a period.
    sentences = ["This is a sentence." for _ in range(200)]
    long_text = " ".join(sentences)
    c = Citation(
        index=1,
        paper_id=uuid4(),
        paper_title="A Paper",
        section=None,
        snippet=long_text,
    )
    assert c.snippet.endswith(".")


def test_full_chunk_cannot_be_smuggled_through_model() -> None:
    # 10x larger than MAX_SNIPPET_WORDS.
    massive = " ".join(f"token{i}" for i in range(MAX_SNIPPET_WORDS * 10))
    c = Citation(
        index=1,
        paper_id=uuid4(),
        paper_title="A Paper",
        section=None,
        snippet=massive,
    )
    assert len(c.snippet.split()) <= MAX_SNIPPET_WORDS


def test_snippet_cannot_be_set_post_validation_to_bypass_cap() -> None:
    c = Citation(
        index=1,
        paper_id=uuid4(),
        paper_title="A Paper",
        section=None,
        snippet="short",
    )
    massive = " ".join(f"token{i}" for i in range(500))
    # Pydantic models default to mutable — but we freeze this one.
    with pytest.raises((AttributeError, TypeError, ValueError)):
        c.snippet = massive  # type: ignore[misc]


def test_index_must_be_positive() -> None:
    with pytest.raises(ValueError):
        Citation(
            index=0,
            paper_id=uuid4(),
            paper_title="A Paper",
            section=None,
            snippet="x",
        )
