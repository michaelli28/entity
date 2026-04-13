"""Tests for the citation validator."""
from __future__ import annotations

from uuid import uuid4

from src.rag.citations import validate_citations
from src.rag.grounding import GroundedChunk, Grounding
from src.rag.retriever import RetrievedChunk


def _grounded(*ids: int) -> Grounding:
    chunks = [
        GroundedChunk(
            id=i,
            chunk=RetrievedChunk(
                paper_id=uuid4(),
                paper_title=f"Paper {i}",
                chunk_index=0,
                section="intro",
                content=f"content for chunk {i} goes here with a little more text.",
                score=0.9,
            ),
        )
        for i in ids
    ]
    return Grounding(chunks=chunks, prompt_block="<block>")


def test_valid_citations_pass_through_unchanged() -> None:
    grounding = _grounded(1, 2, 3)
    text, cites = validate_citations("Grit matters [1]. Team matters [2].", grounding)
    assert text == "Grit matters [1]. Team matters [2]."
    indices = [c.index for c in cites]
    assert indices == [1, 2]


def test_orphan_citation_is_stripped_from_text() -> None:
    grounding = _grounded(1, 2)
    text, cites = validate_citations(
        "Grit matters [1]. Something unrelated [5].", grounding
    )
    assert "[5]" not in text
    assert "[1]" in text
    assert [c.index for c in cites] == [1]


def test_duplicate_citations_deduped_in_output_list() -> None:
    grounding = _grounded(1, 2)
    text, cites = validate_citations(
        "Both [1] and again [1] and also [2].", grounding
    )
    # Text preserves both occurrences; citations list is deduped.
    assert text.count("[1]") == 2
    assert [c.index for c in cites] == [1, 2]


def test_citation_includes_paper_metadata() -> None:
    grounding = _grounded(1)
    _, cites = validate_citations("See [1].", grounding)
    assert len(cites) == 1
    assert cites[0].paper_title == "Paper 1"
    assert cites[0].section == "intro"
    assert cites[0].snippet  # non-empty


def test_no_citations_returns_empty_list() -> None:
    grounding = _grounded(1, 2)
    text, cites = validate_citations("No references used.", grounding)
    assert text == "No references used."
    assert cites == []


def test_citations_returned_in_first_appearance_order() -> None:
    grounding = _grounded(1, 2, 3)
    _, cites = validate_citations("First [2] then [1] then [3].", grounding)
    assert [c.index for c in cites] == [2, 1, 3]
