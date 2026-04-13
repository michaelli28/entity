"""Tests for the async OpenAI embeddings client."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from openai import AsyncOpenAI

from src.llm.embeddings import OpenAIEmbedder


@dataclass
class _FakeEmbedding:
    embedding: list[float]


@dataclass
class _FakeResponse:
    data: list[_FakeEmbedding]


def _mock_client(embeddings_per_call: list[list[list[float]]]) -> MagicMock:
    """Build a mock AsyncOpenAI client that returns canned embeddings per call."""
    client = MagicMock(spec=AsyncOpenAI)
    call_iter = iter(embeddings_per_call)

    async def _create(**kwargs: Any) -> _FakeResponse:
        batch = next(call_iter)
        return _FakeResponse(data=[_FakeEmbedding(embedding=e) for e in batch])

    client.embeddings = MagicMock()
    client.embeddings.create = AsyncMock(side_effect=_create)
    return client


@pytest.mark.asyncio
async def test_embed_returns_vectors_of_length_1536() -> None:
    vec = [0.0] * 1536
    client = _mock_client([[vec, vec]])
    embedder = OpenAIEmbedder(api_key="sk-test", client=client)

    out = await embedder.embed(["hello", "world"])

    assert len(out) == 2
    assert all(len(v) == 1536 for v in out)


@pytest.mark.asyncio
async def test_embed_preserves_input_order() -> None:
    client = _mock_client([[[1.0] * 1536, [2.0] * 1536, [3.0] * 1536]])
    embedder = OpenAIEmbedder(api_key="sk-test", client=client)

    out = await embedder.embed(["a", "b", "c"])

    assert out[0][0] == 1.0
    assert out[1][0] == 2.0
    assert out[2][0] == 3.0


@pytest.mark.asyncio
async def test_embed_batches_at_100_inputs() -> None:
    # 150 inputs should trigger 2 API calls (100 + 50).
    first = [[0.1] * 1536 for _ in range(100)]
    second = [[0.2] * 1536 for _ in range(50)]
    client = _mock_client([first, second])
    embedder = OpenAIEmbedder(api_key="sk-test", client=client)

    inputs = [f"text-{i}" for i in range(150)]
    out = await embedder.embed(inputs)

    assert len(out) == 150
    assert client.embeddings.create.await_count == 2
    # Order preserved across batches
    assert out[0][0] == 0.1
    assert out[99][0] == 0.1
    assert out[100][0] == 0.2


@pytest.mark.asyncio
async def test_embed_empty_list_makes_no_api_calls() -> None:
    client = _mock_client([])
    embedder = OpenAIEmbedder(api_key="sk-test", client=client)

    out = await embedder.embed([])

    assert out == []
    assert client.embeddings.create.await_count == 0


@pytest.mark.asyncio
async def test_default_client_is_async_openai() -> None:
    """Caller-free construction uses AsyncOpenAI (not the sync client)."""
    embedder = OpenAIEmbedder(api_key="sk-test")
    assert isinstance(embedder._client, AsyncOpenAI)  # noqa: SLF001


@pytest.mark.asyncio
async def test_embed_sends_correct_model_name() -> None:
    client = _mock_client([[[0.0] * 1536]])
    embedder = OpenAIEmbedder(api_key="sk-test", client=client)

    await embedder.embed(["hello"])

    call_kwargs = client.embeddings.create.await_args.kwargs
    assert call_kwargs["model"] == "text-embedding-3-small"
