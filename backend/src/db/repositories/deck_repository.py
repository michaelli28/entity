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


async def create_upload(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    founder_id: UUID,
    filename: str,
    content_type: str,
    size_bytes: int,
    pdf_bytes: bytes,
) -> dict[str, Any]:
    row = await conn.fetchrow(
        """
        INSERT INTO deck_uploads (founder_id, filename, content_type, size_bytes, pdf_bytes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, filename, content_type, size_bytes, extraction_status, uploaded_at
        """,
        founder_id,
        filename,
        content_type,
        size_bytes,
        pdf_bytes,
    )
    assert row is not None
    return dict(row)


async def set_extraction_done(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    deck_id: UUID,
    sections: dict[str, Any],
) -> None:
    await conn.execute(
        """
        UPDATE deck_uploads
        SET extraction_status = 'done',
            extracted_sections = $2::jsonb,
            extracted_at = now()
        WHERE id = $1
        """,
        deck_id,
        json.dumps(sections),
    )


async def set_extraction_failed(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    deck_id: UUID,
    error: str,
) -> None:
    await conn.execute(
        """
        UPDATE deck_uploads
        SET extraction_status = 'failed',
            extraction_error = $2,
            extracted_at = now()
        WHERE id = $1
        """,
        deck_id,
        error[:500],
    )


async def latest_for_founder(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    founder_id: UUID,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        """
        SELECT id, filename, content_type, size_bytes, extraction_status,
               extraction_error, extracted_sections, uploaded_at, extracted_at
        FROM deck_uploads
        WHERE founder_id = $1
        ORDER BY uploaded_at DESC
        LIMIT 1
        """,
        founder_id,
    )
    return dict(row) if row else None


async def get_pdf_bytes(
    conn: asyncpg.Connection,  # type: ignore[type-arg]
    *,
    deck_id: UUID,
    founder_id: UUID,
) -> bytes | None:
    row = await conn.fetchrow(
        "SELECT pdf_bytes FROM deck_uploads WHERE id = $1 AND founder_id = $2",
        deck_id,
        founder_id,
    )
    return row["pdf_bytes"] if row else None
