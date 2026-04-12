# pyright: reportMissingTypeStubs=false
from typing import Any
from uuid import UUID

from asyncpg import Connection


async def latest_for_founder(
    conn: Connection, *, founder_id: UUID
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT s.*
        FROM signal_scores s
        JOIN startup_profiles sp ON sp.id = s.startup_profile_id
        WHERE sp.founder_id = $1 AND sp.deleted_at IS NULL
        ORDER BY s.computed_at DESC
        LIMIT 1
        """,
        founder_id,
    )
    return dict(row) if row else None
