"""Tests for the safe grounding helper used by the chat handler."""
from __future__ import annotations

from uuid import uuid4
from unittest.mock import AsyncMock, patch

import pytest

from src.core.config import RagMode
from src.rag.chat_grounding import build_chat_grounding
from src.rag.grounding import Grounding
from src.rag.retriever import RetrievedChunk


def _chunk() -> RetrievedChunk:
    return RetrievedChunk(
        paper_id=uuid4(),
        paper_title="X",
        chunk_index=0,
        section="intro",
        content="some evidence",
        score=0.8,
    )


@pytest.mark.asyncio
async def test_returns_empty_grounding_when_rag_mode_off() -> None:
    with patch("src.rag.chat_grounding.settings") as mock_s:
        mock_s.rag_mode = RagMode.OFF
        g = await build_chat_grounding(query="anything", conn=None)
    assert isinstance(g, Grounding)
    assert g.chunks == []


@pytest.mark.asyncio
async def test_returns_empty_grounding_on_retrieval_error() -> None:
    async def _raise(*args, **kwargs):
        raise RuntimeError("db down")

    with (
        patch("src.rag.chat_grounding.settings") as mock_s,
        patch("src.rag.chat_grounding.retrieve", side_effect=_raise),
    ):
        mock_s.rag_mode = RagMode.MENTOR_ONLY
        mock_s.openai_api_key = "sk-x"
        g = await build_chat_grounding(query="question", conn="fake_conn")
    assert g.chunks == []  # silent fallback


@pytest.mark.asyncio
async def test_retrieves_and_builds_grounding_when_enabled() -> None:
    chunks = [_chunk(), _chunk()]
    with (
        patch("src.rag.chat_grounding.settings") as mock_s,
        patch("src.rag.chat_grounding.retrieve", new=AsyncMock(return_value=chunks)),
    ):
        mock_s.rag_mode = RagMode.MENTOR_ONLY
        mock_s.openai_api_key = "sk-x"
        g = await build_chat_grounding(query="q", conn="fake_conn", k=4)
    assert len(g.chunks) == 2
    assert "<research_chunk" in g.prompt_block


@pytest.mark.asyncio
async def test_also_active_in_full_mode() -> None:
    with (
        patch("src.rag.chat_grounding.settings") as mock_s,
        patch(
            "src.rag.chat_grounding.retrieve", new=AsyncMock(return_value=[_chunk()])
        ),
    ):
        mock_s.rag_mode = RagMode.FULL
        mock_s.openai_api_key = "sk-x"
        g = await build_chat_grounding(query="q", conn="fake_conn")
    assert len(g.chunks) == 1
