# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
from typing import Any
from uuid import UUID

from asyncpg import Connection


async def create(
    conn: Connection,
    *,
    founder_id: UUID,
    session_id: UUID | None,
    description: str,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        """
        INSERT INTO founder_commitments (founder_id, session_id, description)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        founder_id,
        session_id,
        description,
    )
    return dict(row)  # type: ignore[arg-type]


async def list_open(
    conn: Connection, founder_id: UUID
) -> list[dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT * FROM founder_commitments
        WHERE founder_id = $1 AND completed_at IS NULL
        ORDER BY created_at DESC
        """,
        founder_id,
    )
    return [dict(r) for r in rows]  # type: ignore[arg-type]


async def mark_done(
    conn: Connection, *, founder_id: UUID, commitment_id: UUID
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        UPDATE founder_commitments
        SET completed_at = now()
        WHERE id = $1 AND founder_id = $2
        RETURNING *
        """,
        commitment_id,
        founder_id,
    )
    return dict(row)  # type: ignore[arg-type] if row else None
