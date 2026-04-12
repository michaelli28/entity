from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import cold_read_repository as crepo
from ..db.repositories import founder_repository as frepo

router = APIRouter(prefix="/api/cold-reads", tags=["cold_reads"])


@router.get("/latest")
async def latest(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        cr = await crepo.latest_for_founder(conn, founder["id"])
    return cr or {}


@router.get("/public/{slug}")
async def public_by_slug(slug: str) -> dict[str, Any]:
    async with get_connection() as conn:
        cr = await crepo.get_by_slug(conn, slug)
    if not cr:
        raise HTTPException(404, "Not found")
    return cr


@router.get("/{cold_read_id}")
async def by_id(
    cold_read_id: UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        cr = await crepo.get_by_id(conn, cold_read_id, founder["id"])
    if not cr:
        raise HTTPException(404, "Not found")
    return cr
