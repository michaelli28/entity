# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUntypedFunctionDecorator=false
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import commitment_repository as comrepo
from ..db.repositories import founder_repository as frepo

router = APIRouter(prefix="/api/commitments", tags=["commitments"])


@router.get("")
async def list_mine(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> list[dict[str, Any]]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        return await comrepo.list_open(conn, founder["id"])


@router.post("/{commitment_id}/complete")
async def complete(
    commitment_id: UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        row = await comrepo.mark_done(
            conn, founder_id=founder["id"], commitment_id=commitment_id
        )
    if not row:
        raise HTTPException(404, "Not found")
    return row
