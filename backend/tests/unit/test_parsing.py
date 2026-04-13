"""Tests for PDF parsing + section detection + PII scrub."""
from pathlib import Path

import pytest

from src.rag.parsing import Section, parse_pdf

_FIXTURES = Path(__file__).parent.parent / "fixtures" / "rag"


def test_parse_pdf_extracts_text() -> None:
    sections = parse_pdf(_FIXTURES / "sectioned.pdf")
    full_text = " ".join(s.content for s in sections)
    assert "founder persistence" in full_text.lower()
    assert "grit" in full_text.lower()


def test_detects_common_academic_sections() -> None:
    sections = parse_pdf(_FIXTURES / "sectioned.pdf")
    heading_titles = {s.heading.lower() for s in sections if s.heading}
    # Every canonical heading from the fixture should be detected
    expected = {"abstract", "introduction", "method", "results", "discussion"}
    assert expected.issubset(heading_titles)


def test_falls_back_to_whole_doc_when_no_headings() -> None:
    sections = parse_pdf(_FIXTURES / "flat.pdf")
    assert len(sections) == 1
    assert sections[0].heading is None
    assert "continuous prose" in sections[0].content


def test_scrubs_email_addresses_from_content() -> None:
    sections = parse_pdf(_FIXTURES / "sectioned.pdf")
    full_text = " ".join(s.content for s in sections)
    assert "jane@example.edu" not in full_text
    # Author name line containing the email should be scrubbed entirely
    assert "jane@" not in full_text


def test_section_objects_are_immutable() -> None:
    sections = parse_pdf(_FIXTURES / "sectioned.pdf")
    with pytest.raises((AttributeError, TypeError)):
        sections[0].heading = "new heading"  # type: ignore[misc]


def test_parse_pdf_returns_section_dataclasses() -> None:
    sections = parse_pdf(_FIXTURES / "sectioned.pdf")
    assert all(isinstance(s, Section) for s in sections)
    for s in sections:
        assert isinstance(s.content, str)
        assert s.content.strip()
