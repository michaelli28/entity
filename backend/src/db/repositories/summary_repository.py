# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
import json
from typing import Any
from uuid import UUID

from asyncpg import Connection


async def upsert(
    conn: Connection,
    *,
    founder_id: UUID,
    session_id: UUID,
    key_facts: list[Any],
    founder_tone: str,
    topics_covered: list[str],
    open_threads: list[str],
) -> dict[str, Any]:
    row = await conn.fetchrow(
        """
        INSERT INTO mentor_session_summaries
            (founder_id, session_id, key_facts, founder_tone,
             topics_covered, open_threads)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6)
        ON CONFLICT (session_id) DO UPDATE SET
            key_facts = EXCLUDED.key_facts,
            founder_tone = EXCLUDED.founder_tone,
            topics_covered = EXCLUDED.topics_covered,
            open_threads = EXCLUDED.open_threads
        RETURNING *
        """,
        founder_id,
        session_id,
        json.dumps(key_facts),
        founder_tone,
        topics_covered,
        open_threads,
    )
    return dict(row)  # type: ignore[arg-type]


async def latest_n(
    conn: Connection, founder_id: UUID, n: int = 3
) -> list[dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT * FROM mentor_session_summaries
        WHERE founder_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        founder_id,
        n,
    )
    return [dict(r) for r in rows]  # type: ignore[arg-type]
