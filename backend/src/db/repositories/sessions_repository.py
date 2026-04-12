# pyright: reportMissingTypeStubs=false
from typing import Any
from uuid import UUID

from asyncpg import Connection


async def create_or_get_active(
    conn: Connection,
    *,
    founder_id: UUID,
    startup_profile_id: UUID,
    session_type: str,
    target_category: str | None = None,
    target_signal: str | None = None,
) -> dict[str, Any]:
    if session_type == "deep_dive":
        row = await conn.fetchrow(
            """
            INSERT INTO mentor_sessions
                (founder_id, startup_profile_id, session_type,
                 target_category, target_signal)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            """,
            founder_id, startup_profile_id, session_type,
            target_category, target_signal,
        )
        assert row is not None
        return dict(row)

    row = await conn.fetchrow(
        """
        INSERT INTO mentor_sessions
            (founder_id, startup_profile_id, session_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (founder_id, session_type)
            WHERE completed_at IS NULL AND session_type <> 'deep_dive'
        DO NOTHING
        RETURNING *
        """,
        founder_id, startup_profile_id, session_type,
    )
    if row is not None:
        return dict(row)
    existing = await conn.fetchrow(
        """
        SELECT * FROM mentor_sessions
        WHERE founder_id = $1 AND session_type = $2 AND completed_at IS NULL
        LIMIT 1
        """,
        founder_id, session_type,
    )
    assert existing is not None
    return dict(existing)


async def list_by_founder(
    conn: Connection, *, founder_id: UUID
) -> list[dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT * FROM mentor_sessions
        WHERE founder_id = $1
        ORDER BY started_at DESC
        """,
        founder_id,
    )
    return [dict(r) for r in rows]


async def get_by_id_scoped(
    conn: Connection, *, session_id: UUID, founder_id: UUID
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        "SELECT * FROM mentor_sessions WHERE id = $1 AND founder_id = $2",
        session_id, founder_id,
    )
    return dict(row) if row else None


async def update_coverage(
    conn: Connection,
    *,
    session_id: UUID,
    founder_id: UUID,
    new_score: int,
    threshold: int,
    user_turn_count: int,
    min_turns: int,
) -> None:
    await conn.execute(
        """
        UPDATE mentor_sessions
        SET coverage_score = GREATEST(coverage_score, $3::int),
            suggest_complete = suggest_complete
                OR ($3::int >= $4::int AND $5::int >= $6::int)
        WHERE id = $1 AND founder_id = $2
        """,
        session_id, founder_id, new_score, threshold, user_turn_count, min_turns,
    )


async def complete(
    conn: Connection, *, session_id: UUID, founder_id: UUID
) -> int:
    result = await conn.execute(
        """
        UPDATE mentor_sessions
        SET completed_at = now()
        WHERE id = $1 AND founder_id = $2 AND completed_at IS NULL
        """,
        session_id, founder_id,
    )
    return int(result.split()[-1])


async def deep_dive_recommendation(
    conn: Connection, *, founder_id: UUID
) -> dict[str, Any]:
    """Read latest signal_scores; return weakest category + signal."""
    row = await conn.fetchrow(
        """
        SELECT kv.key AS category,
               (kv.value)::text::int AS subscore
        FROM signal_scores s
        CROSS JOIN LATERAL jsonb_each(s.category_scores) AS kv
        WHERE s.startup_profile_id IN (
            SELECT id FROM startup_profiles WHERE founder_id = $1
        )
          AND jsonb_typeof(kv.value) = 'number'
        ORDER BY subscore ASC, s.computed_at DESC
        LIMIT 1
        """,
        founder_id,
    )
    if row is None:
        return {
            "target_category": "problem",
            "target_signal": "pain_points",
            "is_default": True,
        }
    category = row["category"]
    weakest_signal_by_category: dict[str, str] = {
        "founder": "founder_background",
        "market": "tam",
        "problem": "pain_points",
        "competition": "competition_analysis",
        "product": "product_description",
        "traction": "mrr_or_revenue",
        "pricing": "pricing_model",
        "team": "team_composition",
    }
    target_signal = weakest_signal_by_category.get(category, "pain_points")
    return {
        "target_category": category,
        "target_signal": target_signal,
        "is_default": False,
    }
