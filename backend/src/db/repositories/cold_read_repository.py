# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportReturnType=false
# pyright: reportCallIssue=false
# pyright: reportArgumentType=false
import secrets
from typing import Any
from uuid import UUID

from asyncpg import Connection


async def create(
    conn: Connection,
    *,
    founder_id: UUID,
    session_id: UUID,
    what_i_heard: str,
    investor_pushback: list[str],
    three_unanswered_questions: list[str],
) -> dict[str, Any]:
    slug = secrets.token_urlsafe(12)
    row = await conn.fetchrow(
        """
        INSERT INTO cold_reads
            (founder_id, session_id, what_i_heard,
             investor_pushback, three_unanswered_questions, public_slug)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        """,
        founder_id,
        session_id,
        what_i_heard,
        investor_pushback,
        three_unanswered_questions,
        slug,
    )
    return dict(row)


async def get_by_id(
    conn: Connection, cold_read_id: UUID, founder_id: UUID
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        "SELECT * FROM cold_reads WHERE id = $1 AND founder_id = $2",
        cold_read_id,
        founder_id,
    )
    return dict(row) if row else None


async def latest_for_founder(
    conn: Connection, founder_id: UUID
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        "SELECT * FROM cold_reads WHERE founder_id = $1 "
        "ORDER BY created_at DESC LIMIT 1",
        founder_id,
    )
    return dict(row) if row else None


async def get_by_slug(conn: Connection, slug: str) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT cr.*, f.name as founder_name, sp.company_name
        FROM cold_reads cr
        JOIN founders f ON f.id = cr.founder_id
        LEFT JOIN startup_profiles sp ON sp.founder_id = cr.founder_id
        WHERE cr.public_slug = $1
        """,
        slug,
    )
    return dict(row) if row else None
