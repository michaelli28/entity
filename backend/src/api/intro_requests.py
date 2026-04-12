# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUntypedFunctionDecorator=false
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo
from ..integrations import posthog as ph

router = APIRouter(prefix="/api/intro-requests", tags=["intros"])


class IntroRequest(BaseModel):
    investor_type: str = Field(pattern=r"^(angel|seed_vc|operator_angel)$")


@router.post("")
async def create(
    body: IntroRequest,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, str]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        await conn.execute(
            """
            INSERT INTO intro_requests (founder_id, investor_type)
            VALUES ($1, $2)
            """,
            founder["id"],
            body.investor_type,
        )
    ph.capture(
        claims["sub"],
        "intro_request_clicked",
        {"investor_type": body.investor_type},
    )
    return {
        "status": "on_waitlist",
        "message": (
            "You're on the waitlist for investor intros. We'll reach out "
            "as availability opens."
        ),
    }
