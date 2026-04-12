# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
"""Nightly GDPR hard-delete: founders soft-deleted > 30 days ago.

Cascade FKs remove child rows. Audit log records only a hash of the
clerk_user_id so the operation itself remains privacy-preserving.
"""
import hashlib

import structlog

from ..db.connection import get_connection

log = structlog.get_logger()


async def run() -> int:
    purged = 0
    async with get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT id, clerk_user_id FROM founders
            WHERE deleted_at IS NOT NULL
              AND deleted_at < now() - INTERVAL '30 days'
            LIMIT 100
            """
        )
        for r in rows:
            hashed = hashlib.sha256(
                r["clerk_user_id"].encode()
            ).hexdigest()[:16]
            await conn.execute("DELETE FROM founders WHERE id = $1", r["id"])
            log.info("founder_purged", hashed_clerk_id=hashed)
            purged += 1
    return purged
