"""Tests for the grounding builder (chunk→prompt-block)."""
from __future__ import annotations

from uuid import uuid4

from src.rag.grounding import Grounding, build_grounding_from_chunks
from src.rag.retriever import RetrievedChunk


def _chunk(idx: int, title: str, section: str | None, content: str) -> RetrievedChunk:
    return RetrievedChunk(
        paper_id=uuid4(),
        paper_title=title,
        chunk_index=idx,
        section=section,
        content=content,
        score=0.9,
    )


def test_empty_input_returns_empty_grounding() -> None:
    g = build_grounding_from_chunks([])
    assert isinstance(g, Grounding)
    assert g.chunks == []
    assert g.prompt_block == ""


def test_chunks_wrapped_in_research_chunk_tags() -> None:
    chunks = [
        _chunk(0, "Paper A", "intro", "grit predicts outcomes"),
        _chunk(1, "Paper B", "method", "we surveyed 200 founders"),
    ]
    g = build_grounding_from_chunks(chunks)
    assert '<research_chunk id="1"' in g.prompt_block
    assert '<research_chunk id="2"' in g.prompt_block
    assert "</research_chunk>" in g.prompt_block
    assert "grit predicts outcomes" in g.prompt_block
    assert "we surveyed 200 founders" in g.prompt_block


def test_ids_are_sequential_from_one() -> None:
    chunks = [
        _chunk(5, "A", None, "x"),
        _chunk(2, "B", None, "y"),
        _chunk(7, "C", None, "z"),
    ]
    g = build_grounding_from_chunks(chunks)
    assert '<research_chunk id="1"' in g.prompt_block
    assert '<research_chunk id="2"' in g.prompt_block
    assert '<research_chunk id="3"' in g.prompt_block
    assert '<research_chunk id="4"' not in g.prompt_block


def test_paper_title_and_section_in_tag_attributes() -> None:
    chunk = _chunk(0, "Gompers 2020", "discussion", "body text here")
    g = build_grounding_from_chunks([chunk])
    assert 'paper="Gompers 2020"' in g.prompt_block
    assert 'section="discussion"' in g.prompt_block


def test_section_attribute_omitted_when_none() -> None:
    chunk = _chunk(0, "No Section Paper", None, "body")
    g = build_grounding_from_chunks([chunk])
    assert 'section="' not in g.prompt_block or 'section=""' in g.prompt_block


def test_chunks_list_preserves_input_order_and_assigns_ids() -> None:
    chunks = [
        _chunk(0, "A", None, "first"),
        _chunk(0, "B", None, "second"),
    ]
    g = build_grounding_from_chunks(chunks)
    assert len(g.chunks) == 2
    assert g.chunks[0].id == 1
    assert g.chunks[1].id == 2
    assert g.chunks[0].chunk.paper_title == "A"
    assert g.chunks[1].chunk.paper_title == "B"


def test_dangerous_characters_in_content_are_escaped_from_attributes() -> None:
    """Content with < or > should not break the enclosing XML-ish tags."""
    chunk = _chunk(0, 'Paper "Quoted"', None, 'some <script>x</script> text')
    g = build_grounding_from_chunks([chunk])
    # paper title attribute: quotes must be escaped
    assert 'paper="Paper &quot;Quoted&quot;"' in g.prompt_block
    # content may stay as-is (treated as data inside the tag body)
    assert "<script>" in g.prompt_block
