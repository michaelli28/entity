"""Retrieval recall eval (blocking gate before any prod wiring).

Runs the pre-registered 15 queries in tests/fixtures/rag/eval_queries.json
against the live ingested corpus. Each query's expected paper(s) must
appear in the top-3 retrieved chunks for at least 12/15 queries (80%).

Skips when DATABASE_URL is unset or OPENAI_API_KEY is unset (for hermetic
CI environments).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from src.core.config import settings
from src.db.connection import get_connection
from src.llm.embeddings import OpenAIEmbedder
from src.rag.retriever import retrieve

pytestmark = pytest.mark.asyncio

_FIXTURE = (
    Path(__file__).parent.parent / "fixtures" / "rag" / "eval_queries.json"
)

_DB_AVAILABLE = bool(os.getenv("DATABASE_URL"))
_KEY_AVAILABLE = bool(os.getenv("OPENAI_API_KEY") or settings.openai_api_key)

_MIN_PASSING = 12  # 80% of 15


def _load_queries() -> list[dict[str, object]]:
    data = json.loads(_FIXTURE.read_text())
    return data["queries"]


@pytest.mark.skipif(
    not (_DB_AVAILABLE and _KEY_AVAILABLE),
    reason="requires DATABASE_URL and OPENAI_API_KEY",
)
async def test_retrieval_recall_gate_at_80_percent_top_3() -> None:
    queries = _load_queries()
    embedder = OpenAIEmbedder(
        api_key=settings.openai_api_key or os.environ["OPENAI_API_KEY"]
    )

    passes = 0
    failures: list[tuple[str, list[str], list[str]]] = []

    async with get_connection() as conn:
        for item in queries:
            q = str(item["query"])
            expected = {str(t) for t in item["expected_titles"]}  # type: ignore[arg-type]

            results = await retrieve(
                q, k=3, min_score=-1.0, conn=conn, embedder=embedder
            )
            got_titles = [r.paper_title for r in results]

            if expected.intersection(got_titles):
                passes += 1
            else:
                failures.append((q, sorted(expected), got_titles))

    # Emit diagnostics for any failures regardless of pass/fail to aid tuning.
    if failures:
        print("\n--- retrieval eval failures ---")
        for q, exp, got in failures:
            print(f"  query: {q}")
            print(f"    expected any of: {exp}")
            print(f"    got top-3:       {got}")

    assert passes >= _MIN_PASSING, (
        f"retrieval eval gate failed: {passes}/{len(queries)} "
        f"(need ≥{_MIN_PASSING}); see stdout for failures"
    )
