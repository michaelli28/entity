# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUntypedFunctionDecorator=false
# pyright: reportOptionalSubscript=false
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo

router = APIRouter(prefix="/api/cofounder", tags=["cofounder"])


@router.post("/invite")
async def create_invite(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, str]:
    async with get_connection() as conn, conn.transaction():
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        company_id = founder.get("company_id") or uuid.uuid4()
        if founder.get("company_id") is None:
            await conn.execute(
                "UPDATE founders SET company_id = $1 WHERE id = $2",
                company_id,
                founder["id"],
            )
        row = await conn.fetchrow(
            """
            INSERT INTO cofounder_invites (inviter_founder_id, company_id)
            VALUES ($1, $2)
            RETURNING token
            """,
            founder["id"],
            company_id,
        )
    return {"token": str(row["token"])}


@router.post("/accept/{token}")
async def accept_invite(
    token: uuid.UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, str]:
    async with get_connection() as conn, conn.transaction():
        invite = await conn.fetchrow(
            """
            SELECT * FROM cofounder_invites
            WHERE token = $1 AND used_at IS NULL AND expires_at > now()
            """,
            token,
        )
        if not invite:
            raise HTTPException(400, "Invalid or expired invite")
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        await conn.execute(
            "UPDATE founders SET company_id = $1 WHERE id = $2",
            invite["company_id"],
            founder["id"],
        )
        await conn.execute(
            """
            UPDATE cofounder_invites
            SET used_at = now(), used_by_founder_id = $1
            WHERE token = $2
            """,
            founder["id"],
            token,
        )
    return {"status": "joined"}
