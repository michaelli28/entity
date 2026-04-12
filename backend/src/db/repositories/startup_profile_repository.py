# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportReturnType=false
# pyright: reportCallIssue=false
# pyright: reportArgumentType=false
from typing import Any

import asyncpg


async def ensure_for_founder(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    founder_id: Any,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        """
        INSERT INTO startup_profiles (founder_id)
        VALUES ($1)
        ON CONFLICT (founder_id) WHERE deleted_at IS NULL
        DO UPDATE SET founder_id = EXCLUDED.founder_id
        RETURNING *
        """,
        founder_id,
    )
    return dict(row)  # type: ignore[arg-type]


async def get_by_founder(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    founder_id: Any,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        "SELECT * FROM startup_profiles WHERE founder_id = $1 AND deleted_at IS NULL",
        founder_id,
    )
    return dict(row) if row else None  # type: ignore[arg-type]


async def update_for_founder(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    founder_id: Any,
    company_name: str | None = None,
    one_liner: str | None = None,
    stage: str | None = None,
    category: str | None = None,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        UPDATE startup_profiles SET
            company_name = COALESCE($2, company_name),
            one_liner = COALESCE($3, one_liner),
            stage = COALESCE($4, stage),
            market_category = COALESCE($5, market_category)
        WHERE founder_id = $1 AND deleted_at IS NULL
        RETURNING *
        """,
        founder_id,
        company_name,
        one_liner,
        stage,
        category,
    )
    return dict(row) if row else None  # type: ignore[arg-type]
