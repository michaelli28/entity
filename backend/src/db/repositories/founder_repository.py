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

import asyncpg


async def upsert_by_clerk_id(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    clerk_user_id: str,
    email: str,
    name: str,
    avatar_url: str | None,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        """
        INSERT INTO founders (clerk_user_id, email, name, avatar_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (clerk_user_id) DO UPDATE
            SET email = EXCLUDED.email,
                name = EXCLUDED.name,
                avatar_url = COALESCE(EXCLUDED.avatar_url, founders.avatar_url),
                updated_at = now()
        RETURNING *
        """,
        clerk_user_id,
        email,
        name,
        avatar_url,
    )
    return dict(row)  # type: ignore[arg-type]


async def find_by_clerk_id(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    clerk_user_id: str,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        "SELECT * FROM founders WHERE clerk_user_id = $1 AND deleted_at IS NULL",
        clerk_user_id,
    )
    return dict(row) if row else None  # type: ignore[arg-type]


async def update_profile(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    founder_id: UUID,
    name: str | None = None,
    linkedin_url: str | None = None,
    github_username: str | None = None,
    what_would_make_10x: str | None = None,
    website_url: str | None = None,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        UPDATE founders SET
            name = COALESCE($2, name),
            linkedin_url = COALESCE($3, linkedin_url),
            github_username = COALESCE($4, github_username),
            what_would_make_10x = COALESCE($5, what_would_make_10x),
            website_url = COALESCE($6, website_url)
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
        """,
        founder_id,
        name,
        linkedin_url,
        github_username,
        what_would_make_10x,
        website_url,
    )
    return dict(row) if row else None  # type: ignore[arg-type]


async def update_github_data(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    founder_id: UUID,
    github_data: dict[str, Any] | None,
) -> None:
    await conn.execute(
        "UPDATE founders SET github_data = $2::jsonb WHERE id = $1",
        founder_id,
        json.dumps(github_data) if github_data is not None else None,
    )


async def complete_onboarding(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    founder_id: UUID,
) -> None:
    await conn.execute(
        "UPDATE founders SET onboarding_completed_at = now() WHERE id = $1",
        founder_id,
    )


async def soft_delete(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    clerk_user_id: str,
) -> None:
    await conn.execute(
        "UPDATE founders SET deleted_at = now() WHERE clerk_user_id = $1",
        clerk_user_id,
    )
