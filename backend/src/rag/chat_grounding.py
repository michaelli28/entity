"""Safe grounding helper for the mentor chat path.

Gates on `settings.rag_mode` and falls back to an empty grounding on any
retrieval / embedding error. The chat handler should never 500 because RAG
broke — a silently-ungrounded response beats a failed stream.
"""
from __future__ import annotations

import structlog
from asyncpg import Connection

from src.core.config import RagMode, settings
from src.rag.grounding import Grounding, build_grounding_from_chunks
from src.rag.retriever import retrieve

log = structlog.get_logger(__name__)


async def build_chat_grounding(
    *,
    query: str,
    conn: Connection | None,
    k: int = 4,
    min_score: float = 0.3,
) -> Grounding:
    """Retrieve top-k chunks for the query and wrap them as a Grounding.

    Returns an empty Grounding when RAG is disabled, when the key is missing,
    or when retrieval raises for any reason.
    """
    if settings.rag_mode is RagMode.OFF:
        return Grounding(chunks=[], prompt_block="")
    if not settings.openai_api_key:
        return Grounding(chunks=[], prompt_block="")
    if conn is None or not query.strip():
        return Grounding(chunks=[], prompt_block="")

    try:
        chunks = await retrieve(query, k=k, min_score=min_score, conn=conn)
    except Exception:
        log.exception("rag_retrieve_failed_in_chat")
        return Grounding(chunks=[], prompt_block="")

    return build_grounding_from_chunks(chunks)
