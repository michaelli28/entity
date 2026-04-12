# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
from asyncpg import Connection


async def claim_event_id(conn: Connection, event_id: str) -> bool:
    """Returns True if first time seeing this event_id, False if duplicate."""
    row = await conn.fetchrow(
        """
        INSERT INTO processed_webhooks (event_id)
        VALUES ($1)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
        """,
        event_id,
    )
    return row is not None
