"""Ingest research papers into research_papers + research_chunks.

Usage:
    uv run python -m scripts.ingest_papers            # incremental
    uv run python -m scripts.ingest_papers --force    # re-ingest all

Idempotency is keyed on (sha256, chunking_version). Any change to chunking
strategy that bumps `CHUNKING_VERSION` forces a natural re-ingest on next
run even without `--force`.

Each paper's rows (paper + chunks + chunk_count) are written inside a single
`async with conn.transaction()`, so a mid-paper failure leaves no partial
state in the database.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import asyncpg

from src.core.config import settings
from src.db.connection import close_pool, get_connection, init_pool
from src.llm.embeddings import EMBEDDING_DIM, OpenAIEmbedder
from src.rag.chunking import CHUNKING_VERSION, Chunk, chunk_section
from src.rag.parsing import parse_pdf

_DEFAULT_PAPERS_DIR = Path(__file__).resolve().parents[1] / "data" / "papers"


def _sha256_of_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _paper_title_from_path(path: Path) -> str:
    return path.stem


def plan_chunks_for_paper(path: Path) -> list[Chunk]:
    """Parse + chunk a PDF. Does not touch the DB or the embedding API."""
    sections = parse_pdf(path)
    out: list[Chunk] = []
    running = 0
    for section in sections:
        section_chunks = chunk_section(section)
        for c in section_chunks:
            out.append(
                Chunk(
                    chunk_index=running,
                    heading=c.heading,
                    content=c.content,
                    token_count=c.token_count,
                )
            )
            running += 1
    return out


async def _already_ingested(
    conn: asyncpg.Connection, sha256: str, version: int
) -> bool:
    row = await conn.fetchrow(
        "SELECT 1 FROM research_papers WHERE sha256 = $1 AND chunking_version = $2",
        sha256,
        version,
    )
    return row is not None


def _format_vector(values: list[float]) -> str:
    """pgvector's asyncpg binding accepts JSON-array-style strings."""
    return json.dumps(values, separators=(",", ":"))


async def _ingest_one_paper(
    conn: asyncpg.Connection,
    *,
    path: Path,
    embedder: OpenAIEmbedder,
    force: bool,
) -> tuple[str, int]:
    """Ingest a single paper atomically. Returns (status, chunk_count).

    status ∈ {"ingested", "skipped", "replaced"}.
    """
    sha = _sha256_of_file(path)

    if not force and await _already_ingested(conn, sha, CHUNKING_VERSION):
        return ("skipped", 0)

    chunks = plan_chunks_for_paper(path)
    if not chunks:
        return ("skipped", 0)

    embeddings = await embedder.embed([c.content for c in chunks])
    assert all(len(e) == EMBEDDING_DIM for e in embeddings), "unexpected dim"

    async with conn.transaction():
        if force:
            # Remove any previous row(s) for this source_path so replace is clean.
            await conn.execute(
                "DELETE FROM research_papers WHERE source_path = $1",
                str(path),
            )
        paper_row = await conn.fetchrow(
            """
            INSERT INTO research_papers
                (title, authors, source_path, sha256, chunking_version, chunk_count)
            VALUES ($1, NULL, $2, $3, $4, 0)
            RETURNING id
            """,
            _paper_title_from_path(path),
            str(path),
            sha,
            CHUNKING_VERSION,
        )
        paper_id = paper_row["id"]

        # Bulk-insert chunks.
        await conn.executemany(
            """
            INSERT INTO research_chunks
                (paper_id, chunk_index, section, content, token_count, embedding)
            VALUES ($1, $2, $3, $4, $5, $6::vector)
            """,
            [
                (
                    paper_id,
                    c.chunk_index,
                    c.heading,
                    c.content,
                    c.token_count,
                    _format_vector(emb),
                )
                for c, emb in zip(chunks, embeddings, strict=True)
            ],
        )

        await conn.execute(
            "UPDATE research_papers SET chunk_count = $1 WHERE id = $2",
            len(chunks),
            paper_id,
        )

    return ("replaced" if force else "ingested", len(chunks))


async def run(papers_dir: Path, force: bool) -> None:
    if not settings.openai_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is required for ingestion. Set it in backend/.env."
        )

    pdf_paths = sorted(papers_dir.glob("*.pdf"))
    if not pdf_paths:
        print(f"[ingest] No PDFs found in {papers_dir}", file=sys.stderr)
        return

    embedder = OpenAIEmbedder(api_key=settings.openai_api_key)

    await init_pool()
    try:
        async with get_connection() as conn:
            for path in pdf_paths:
                status, n = await _ingest_one_paper(
                    conn, path=path, embedder=embedder, force=force
                )
                print(f"[ingest] {path.name}: {status} ({n} chunks)")
    finally:
        await close_pool()


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--papers-dir",
        type=Path,
        default=_DEFAULT_PAPERS_DIR,
        help="Directory containing PDFs (default: backend/data/papers).",
    )
    p.add_argument(
        "--force",
        action="store_true",
        help="Re-ingest every paper even if already present.",
    )
    return p.parse_args()


async def _main() -> None:
    args = parse_args()
    await run(args.papers_dir, args.force)


if __name__ == "__main__":
    asyncio.run(_main())
