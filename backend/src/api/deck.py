# pyright: reportMissingTypeStubs=false
from typing import Any
from uuid import UUID

import structlog
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import deck_repository as drepo
from ..db.repositories import founder_repository as frepo
from ..llm.deck_extract import extract_deck_sections

log = structlog.get_logger()
router = APIRouter(prefix="/api/deck", tags=["deck"])

MAX_BYTES = 5 * 1024 * 1024  # 5 MB


async def _extract_bg(deck_id: UUID, pdf_bytes: bytes) -> None:
    try:
        sections = await extract_deck_sections(pdf_bytes)
        async with get_connection() as conn:
            await drepo.set_extraction_done(
                conn, deck_id=deck_id, sections=sections.model_dump()
            )
    except Exception as e:
        log.exception("deck_extract_bg_failed")
        async with get_connection() as conn:
            await drepo.set_extraction_failed(conn, deck_id=deck_id, error=str(e))


@router.post("")
async def upload_deck(
    bg: BackgroundTasks,
    file: UploadFile = File(...),  # noqa: B008
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=415, detail="only application/pdf is accepted")
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="file too large (5 MB limit)")

    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        row = await drepo.create_upload(
            conn,
            founder_id=founder["id"],
            filename=file.filename or "deck.pdf",
            content_type=file.content_type,
            size_bytes=len(data),
            pdf_bytes=data,
        )

    deck_id = UUID(str(row["id"]))
    bg.add_task(_extract_bg, deck_id, data)

    return {
        "id": str(row["id"]),
        "filename": row["filename"],
        "size_bytes": row["size_bytes"],
        "extraction_status": "pending",
        "uploaded_at": row["uploaded_at"].isoformat(),
    }


@router.get("/latest")
async def get_latest_deck(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any] | None:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        row = await drepo.latest_for_founder(conn, founder_id=founder["id"])
    if row is None:
        return None
    sections = row.get("extracted_sections")
    if isinstance(sections, str):
        try:
            import json as _json

            sections = _json.loads(sections)
        except (ValueError, TypeError):
            sections = None
    return {
        "id": str(row["id"]),
        "filename": row["filename"],
        "size_bytes": row["size_bytes"],
        "extraction_status": row["extraction_status"],
        "extraction_error": row.get("extraction_error"),
        "extracted_sections": sections,
        "uploaded_at": row["uploaded_at"].isoformat(),
        "extracted_at": (
            row["extracted_at"].isoformat() if row.get("extracted_at") else None
        ),
    }
