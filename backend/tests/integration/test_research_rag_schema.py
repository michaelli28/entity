"""Schema tests for the research_papers + research_chunks RAG tables.

Requires a live Postgres with migrations applied (DATABASE_URL set).
Skipped in CI environments without a DB.
"""
import os

import pytest

from src.db.connection import get_connection

pytestmark = pytest.mark.asyncio

_DB_AVAILABLE = bool(os.getenv("DATABASE_URL"))


async def _columns(conn, table: str) -> dict[str, str]:
    rows = await conn.fetch(
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        """,
        table,
    )
    return {r["column_name"]: r["data_type"] for r in rows}


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_research_papers_table_exists_with_expected_columns() -> None:
    async with get_connection() as conn:
        cols = await _columns(conn, "research_papers")
    expected = {
        "id",
        "title",
        "authors",
        "source_path",
        "sha256",
        "chunking_version",
        "chunk_count",
        "ingested_at",
    }
    assert expected.issubset(cols.keys())


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_research_chunks_table_exists_with_expected_columns() -> None:
    async with get_connection() as conn:
        cols = await _columns(conn, "research_chunks")
    expected = {
        "id",
        "paper_id",
        "chunk_index",
        "section",
        "content",
        "token_count",
        "embedding",
        "created_at",
    }
    assert expected.issubset(cols.keys())


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_research_papers_unique_on_sha_and_chunking_version() -> None:
    async with get_connection() as conn:
        row = await conn.fetchrow(
            """
            SELECT indexdef FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = 'research_papers'
              AND indexname = 'idx_research_papers_sha_version'
            """
        )
    assert row is not None
    assert "UNIQUE" in row["indexdef"].upper()
    assert "sha256" in row["indexdef"]
    assert "chunking_version" in row["indexdef"]


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_no_hnsw_index_on_research_chunks() -> None:
    """Sanity: we deliberately do NOT use HNSW at this corpus size."""
    async with get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT indexdef FROM pg_indexes
            WHERE schemaname = 'public' AND tablename = 'research_chunks'
            """
        )
    for r in rows:
        assert "hnsw" not in r["indexdef"].lower()


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_rls_enabled_on_research_tables() -> None:
    async with get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT relname, relrowsecurity
            FROM pg_class
            WHERE relname IN ('research_papers', 'research_chunks')
            """
        )
    enabled = {r["relname"]: r["relrowsecurity"] for r in rows}
    assert enabled.get("research_papers") is True
    assert enabled.get("research_chunks") is True


@pytest.mark.skipif(not _DB_AVAILABLE, reason="DATABASE_URL not set")
async def test_embedding_column_is_1536_dim_vector() -> None:
    async with get_connection() as conn:
        row = await conn.fetchrow(
            """
            SELECT format_type(a.atttypid, a.atttypmod) AS type
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            WHERE c.relname = 'research_chunks' AND a.attname = 'embedding'
            """
        )
    assert row is not None
    # pgvector formats as e.g. "vector(1536)" or "extensions.vector(1536)"
    assert "1536" in row["type"]
