"""Tests for the mentor-summary grounding helper."""
from __future__ import annotations

from uuid import uuid4
from unittest.mock import AsyncMock, patch

import pytest

from src.core.config import RagMode
from src.rag.grounding import Grounding
from src.rag.retriever import RetrievedChunk
from src.rag.summary_grounding import build_summary_grounding, build_summary_query


def _chunk() -> RetrievedChunk:
    return RetrievedChunk(
        paper_id=uuid4(),
        paper_title="X",
        chunk_index=0,
        section="intro",
        content="evidence body",
        score=0.8,
    )


def test_build_summary_query_uses_profile_and_conversation_themes() -> None:
    q = build_summary_query(
        profile_one_liner="we do vertical SaaS for HVAC",
        transcripts="founder: we have 4 design partners\nmentor: how big is TAM?",
    )
    assert "HVAC" in q or "vertical SaaS" in q
    assert len(q) <= 800


def test_build_summary_query_handles_empty_profile() -> None:
    q = build_summary_query(profile_one_liner="", transcripts="founder: hi")
    # Must still produce something non-empty with fallback terms.
    assert q.strip()


@pytest.mark.asyncio
async def test_summary_grounding_skips_when_not_full_mode() -> None:
    with patch("src.rag.summary_grounding.settings") as mock_s:
        mock_s.rag_mode = RagMode.MENTOR_ONLY
        mock_s.openai_api_key = "sk-x"
        g = await build_summary_grounding(
            profile_one_liner="x", transcripts="y", conn="c"
        )
    assert g.chunks == []  # summary grounding is FULL only


@pytest.mark.asyncio
async def test_summary_grounding_active_in_full_mode() -> None:
    with (
        patch("src.rag.summary_grounding.settings") as mock_s,
        patch(
            "src.rag.summary_grounding.retrieve",
            new=AsyncMock(return_value=[_chunk(), _chunk()]),
        ),
    ):
        mock_s.rag_mode = RagMode.FULL
        mock_s.openai_api_key = "sk-x"
        g = await build_summary_grounding(
            profile_one_liner="x", transcripts="y", conn="c"
        )
    assert len(g.chunks) == 2
    assert "<research_chunk" in g.prompt_block


@pytest.mark.asyncio
async def test_summary_grounding_silent_fallback_on_error() -> None:
    async def _raise(*args, **kwargs):
        raise RuntimeError("boom")

    with (
        patch("src.rag.summary_grounding.settings") as mock_s,
        patch("src.rag.summary_grounding.retrieve", side_effect=_raise),
    ):
        mock_s.rag_mode = RagMode.FULL
        mock_s.openai_api_key = "sk-x"
        g = await build_summary_grounding(
            profile_one_liner="x", transcripts="y", conn="c"
        )
    assert g.chunks == []
