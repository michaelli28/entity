# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportReturnType=false
# pyright: reportCallIssue=false
# pyright: reportArgumentType=false
import json
from typing import Any
from uuid import UUID

from asyncpg import Connection


async def ensure_session(
    conn: Connection,
    *,
    founder_id: Any,
    startup_profile_id: Any,
    session_id: UUID | None = None,
    session_type: str = "big_picture",
) -> dict[str, Any]:
    if session_id is not None:
        row = await conn.fetchrow(
            "SELECT * FROM mentor_sessions WHERE id = $1 AND founder_id = $2",
            session_id,
            founder_id,
        )
        if row:
            return dict(row)
    row = await conn.fetchrow(
        """
        INSERT INTO mentor_sessions
            (founder_id, startup_profile_id, session_type, started_at)
        VALUES ($1, $2, $3, now())
        RETURNING *
        """,
        founder_id,
        startup_profile_id,
        session_type,
    )
    return dict(row)  # type: ignore[return-value]


async def insert_message(
    conn: Connection,
    session_id: Any,
    *,
    role: str,
    content: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        """
        INSERT INTO mentor_messages (session_id, role, content, metadata)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING *
        """,
        session_id,
        role,
        content,
        json.dumps(metadata or {}),
    )
    return dict(row)  # type: ignore[return-value]


async def recent_messages(
    conn: Connection, session_id: Any, limit: int = 20
) -> list[dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT * FROM mentor_messages
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        session_id,
        limit,
    )
    return [dict(r) for r in reversed(rows)]


async def turn_count(conn: Connection, session_id: Any) -> int:
    result: int | None = await conn.fetchval(
        "SELECT COUNT(*) FROM mentor_messages WHERE session_id = $1 AND role = 'user'",
        session_id,
    )
    return result or 0


async def user_turn_count(conn: Connection, session_id: Any) -> int:
    """User-role message count; alias for turn_count with explicit naming."""
    result: int | None = await conn.fetchval(
        "SELECT count(*) FROM mentor_messages "
        "WHERE session_id = $1 AND role = 'user'",
        session_id,
    )
    return int(result or 0)
