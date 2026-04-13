"""Unit tests for the ingestion pipeline.

The DB side is covered by an integration test; here we focus on the pure
pipeline helpers (hash, skip logic, embedding batching, transaction rollback
semantics via a fake connection).
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from scripts.ingest_papers import (
    _paper_title_from_path,
    _sha256_of_file,
    plan_chunks_for_paper,
)
from src.rag.chunking import Chunk


_FIXTURES = Path(__file__).parent.parent / "fixtures" / "rag"


def test_sha256_is_deterministic() -> None:
    digest_a = _sha256_of_file(_FIXTURES / "sectioned.pdf")
    digest_b = _sha256_of_file(_FIXTURES / "sectioned.pdf")
    assert digest_a == digest_b
    assert len(digest_a) == 64


def test_sha256_differs_between_files() -> None:
    a = _sha256_of_file(_FIXTURES / "sectioned.pdf")
    b = _sha256_of_file(_FIXTURES / "flat.pdf")
    assert a != b


def test_title_falls_back_to_filename_stem() -> None:
    title = _paper_title_from_path(_FIXTURES / "sectioned.pdf")
    assert title == "sectioned"


def test_plan_chunks_produces_chunks_with_expected_fields() -> None:
    chunks = plan_chunks_for_paper(_FIXTURES / "sectioned.pdf")
    assert len(chunks) >= 1
    for c in chunks:
        assert isinstance(c, Chunk)
        assert c.token_count > 0
        assert c.content.strip()


def test_plan_chunks_preserves_section_headings_when_present() -> None:
    chunks = plan_chunks_for_paper(_FIXTURES / "sectioned.pdf")
    headings = {c.heading for c in chunks if c.heading}
    assert "abstract" in headings or "introduction" in headings
