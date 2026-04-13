"""Async OpenAI embeddings client.

Uses AsyncOpenAI so embedding calls never block the uvicorn event loop.
SDK's built-in `max_retries=3` handles transient 429/5xx automatically.
"""
from __future__ import annotations

from openai import AsyncOpenAI

EMBEDDING_MODEL: str = "text-embedding-3-small"
EMBEDDING_DIM: int = 1536
_BATCH_LIMIT: int = 100


class OpenAIEmbedder:
    """Thin wrapper that batches long inputs and preserves order."""

    def __init__(
        self,
        api_key: str,
        *,
        client: AsyncOpenAI | None = None,
    ) -> None:
        self._client = client or AsyncOpenAI(api_key=api_key, max_retries=3)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        results: list[list[float]] = []
        for start in range(0, len(texts), _BATCH_LIMIT):
            batch = texts[start : start + _BATCH_LIMIT]
            response = await self._client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=batch,
            )
            results.extend(item.embedding for item in response.data)
        return results
