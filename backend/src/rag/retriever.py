"""Retriever over `research_chunks` using pgvector cosine similarity.

At our corpus size (~150–500 chunks) a sequential scan is sub-5ms and avoids
HNSW tuning overhead. Revisit indexing at 50k+ chunks.

Exposes two entry points:
  - `retrieve(query, ...)` — embeds the query then delegates.
  - `retrieve_by_embedding(embedding, ...)` — for callers that want to batch
    embed upstream (e.g. mentor-summary wiring).

On the chat/summary hot path, the caller is expected to wrap these in
try/except and fall back to no-RAG rather than 500-ing the user.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from asyncpg import Connection

from src.core.config import settings
from src.llm.embeddings import EMBEDDING_DIM, OpenAIEmbedder


@dataclass(frozen=True)
class RetrievedChunk:
    paper_id: UUID
    paper_title: str
    chunk_index: int
    section: str | None
    content: str
    score: float  # cosine similarity in [-1, 1]; higher is better


def _format_vector(values: list[float]) -> str:
    return json.dumps(values, separators=(",", ":"))


async def retrieve_by_embedding(
    embedding: list[float],
    *,
    k: int = 5,
    min_score: float = 0.3,
    conn: Connection,
) -> list[RetrievedChunk]:
    if len(embedding) != EMBEDDING_DIM:
        raise ValueError(
            f"embedding dim {len(embedding)} != expected {EMBEDDING_DIM}"
        )
    if k <= 0:
        return []

    rows: list[Any] = await conn.fetch(
        """
        SELECT
            c.paper_id,
            c.chunk_index,
            c.section,
            c.content,
            p.title AS paper_title,
            1.0 - (c.embedding <=> $1::vector) AS score
        FROM research_chunks c
        JOIN research_papers p ON p.id = c.paper_id
        ORDER BY c.embedding <=> $1::vector
        LIMIT $2
        """,
        _format_vector(embedding),
        k,
    )

    out: list[RetrievedChunk] = []
    for row in rows:
        score = float(row["score"])
        if score < min_score:
            continue
        out.append(
            RetrievedChunk(
                paper_id=row["paper_id"],
                paper_title=row["paper_title"],
                chunk_index=row["chunk_index"],
                section=row["section"],
                content=row["content"],
                score=score,
            )
        )
    return out


async def retrieve(
    query: str,
    *,
    k: int = 5,
    min_score: float = 0.3,
    conn: Connection,
    embedder: OpenAIEmbedder | None = None,
) -> list[RetrievedChunk]:
    if not query or not query.strip():
        raise ValueError("query must not be empty")

    if embedder is None:
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY required for retrieve(); pass embedder= or set env"
            )
        embedder = OpenAIEmbedder(api_key=settings.openai_api_key)

    [emb] = await embedder.embed([query])
    return await retrieve_by_embedding(
        emb, k=k, min_score=min_score, conn=conn
    )
