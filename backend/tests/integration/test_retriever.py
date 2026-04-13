"""Integration tests for the pgvector retriever.

Requires a live Postgres with the RAG tables populated by the ingestion
script. Each test seeds a small synthetic paper + 3 chunks so it does not
depend on the real ingested corpus.
"""
from __future__ import annotations

import json
import os

import pytest
from asyncpg import Connection

from src.db.connection import get_connection
from src.rag.retriever import RetrievedChunk, retrieve, retrieve_by_embedding

pytestmark = pytest.mark.asyncio

_DB_AVAILABLE = bool(os.getenv("DATABASE_URL"))


def _vec(primary_idx: int, *, dim: int = 1536) -> list[float]:
    """Return a unit-ish vector with a strong component at `primary_idx`."""
    v = [0.0] * dim
    v[primary_idx] = 1.0
    return v


async def _seed(conn: Connection) -> str:
    """Insert a fresh paper + 3 synthetic chunks. Returns paper id."""
    await conn.execute(
        "DELETE FROM research_papers WHERE source_path LIKE 'test://%'"
    )
    paper_id = await conn.fetchval(
        """
        INSERT INTO research_papers
            (title, source_path, sha256, chunking_version, chunk_count)
        VALUES ('Test Paper', 'test://retriever', 'deadbeef', 99, 3)
        RETURNING id
        """
    )
    chunks = [
        (0, "intro", "grit and persistence correlate with outcomes", 10, _vec(0)),
        (1, "method", "we surveyed founders across stages", 10, _vec(1)),
        (2, "results", "r equals 0.42 between grit and survival", 10, _vec(2)),
    ]
    for idx, section, content, tokens, emb in chunks:
        await conn.execute(
            """
            INSERT INTO research_chunks
                (paper_id, chunk_index, section, content, token_count, embedding)
            VALUES ($1, $2, $3, $4, $5, $6::vector)
            """,
            paper_id,
            idx,
            section,
            content,
            tokens,
            json.dumps(emb, separators=(",", ":")),
        )
    return paper_id


async def _cleanup(conn: Connection) -> None:
    await conn.execute(
        "DELETE FROM research_papers WHERE source_path LIKE 'test://%'"
    )


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_retrieve_by_embedding_returns_top_k_ordered_by_similarity() -> None:
    async with get_connection() as conn:
        await _seed(conn)
        try:
            query_emb = _vec(2)  # matches the "results" chunk
            # Disable min_score so orthogonal synthetic vectors all pass.
            results = await retrieve_by_embedding(
                query_emb, k=3, min_score=-1.0, conn=conn
            )
            assert len(results) == 3
            assert results[0].section == "results"
            # Top result must have the highest score.
            assert results[0].score >= results[1].score >= results[2].score
        finally:
            await _cleanup(conn)


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_retrieve_by_embedding_applies_min_score_filter() -> None:
    async with get_connection() as conn:
        await _seed(conn)
        try:
            query_emb = _vec(0)  # only chunk 0 has a meaningful match
            results = await retrieve_by_embedding(
                query_emb, k=10, min_score=0.5, conn=conn
            )
            # Only the exact-match chunk beats min_score.
            assert len(results) == 1
            assert results[0].section == "intro"
        finally:
            await _cleanup(conn)


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_retrieved_chunk_includes_paper_metadata() -> None:
    async with get_connection() as conn:
        await _seed(conn)
        try:
            results = await retrieve_by_embedding(_vec(0), k=1, conn=conn)
            assert len(results) == 1
            c = results[0]
            assert isinstance(c, RetrievedChunk)
            assert c.paper_title == "Test Paper"
            assert c.section == "intro"
            assert c.content.startswith("grit")
            assert c.chunk_index == 0
            assert c.paper_id is not None
        finally:
            await _cleanup(conn)


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_retrieve_empty_query_raises() -> None:
    with pytest.raises(ValueError, match="empty"):
        async with get_connection() as conn:
            await retrieve("   ", k=3, conn=conn)


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_retrieved_chunk_is_frozen() -> None:
    async with get_connection() as conn:
        await _seed(conn)
        try:
            [chunk] = await retrieve_by_embedding(_vec(0), k=1, conn=conn)
            with pytest.raises((AttributeError, TypeError)):
                chunk.score = 0.0  # type: ignore[misc]
        finally:
            await _cleanup(conn)
