# pyright: reportMissingTypeStubs=false
from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, model_validator

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo
from ..db.repositories import mentor_repository as mrepo
from ..db.repositories import sessions_repository as srepo
from ..db.repositories import startup_profile_repository as srpo
from ..llm.mentor_sessions import (
    CORE_BLUEPRINTS,
    KNOWN_SIGNAL_CATEGORIES,
    KNOWN_SIGNAL_KEYS,
    SessionKey,
)

log = structlog.get_logger()
router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class CreateSessionRequest(BaseModel):
    session_type: SessionKey
    target_category: str | None = None
    target_signal: str | None = None

    @model_validator(mode="after")
    def validate_targets(self) -> "CreateSessionRequest":
        if self.session_type == SessionKey.DEEP_DIVE:
            if not self.target_category or not self.target_signal:
                raise ValueError(
                    "deep_dive requires target_category and target_signal"
                )
            if self.target_category not in KNOWN_SIGNAL_CATEGORIES:
                raise ValueError(
                    f"invalid target_category: {self.target_category}"
                )
            if self.target_signal not in KNOWN_SIGNAL_KEYS:
                raise ValueError(f"invalid target_signal: {self.target_signal}")
        else:
            if self.target_category or self.target_signal:
                raise ValueError("non-deep-dive sessions cannot carry targets")
        return self


class BlueprintPublicResponse(BaseModel):
    key: SessionKey
    title: str
    subtitle: str
    order: int
    starter_questions: tuple[str, ...]


def _serialize_session(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "session_type": row["session_type"],
        "started_at": row["started_at"].isoformat(),
        "completed_at": (
            row["completed_at"].isoformat() if row["completed_at"] else None
        ),
        "coverage_score": row["coverage_score"],
        "suggest_complete": row["suggest_complete"],
        "target_category": row["target_category"],
        "target_signal": row["target_signal"],
    }


@router.get("/blueprints", response_model=list[BlueprintPublicResponse])
async def get_blueprints(
    _claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> list[BlueprintPublicResponse]:
    return [
        BlueprintPublicResponse(
            key=bp.key,
            title=bp.title,
            subtitle=bp.subtitle,
            order=bp.order,
            starter_questions=bp.starter_questions,
        )
        for bp in CORE_BLUEPRINTS
    ]


@router.get("/deep-dive/recommendation")
async def get_deep_dive_recommendation(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        return await srepo.deep_dive_recommendation(conn, founder_id=founder["id"])


@router.get("")
async def list_sessions(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> list[dict[str, Any]]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        rows = await srepo.list_by_founder(conn, founder_id=founder["id"])
        return [_serialize_session(r) for r in rows]


@router.get("/{session_id}")
async def get_session(
    session_id: UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        row = await srepo.get_by_id_scoped(
            conn, session_id=session_id, founder_id=founder["id"]
        )
    if row is None:
        raise HTTPException(status_code=404, detail="session not found")
    return _serialize_session(row)


@router.post("")
async def create_session(
    body: CreateSessionRequest,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        profile = await srpo.get_by_founder(conn, founder["id"])
        if not profile:
            raise HTTPException(status_code=400, detail="complete onboarding first")
        row = await srepo.create_or_get_active(
            conn,
            founder_id=founder["id"],
            startup_profile_id=profile["id"],
            session_type=body.session_type.value,
            target_category=body.target_category,
            target_signal=body.target_signal,
        )
    return _serialize_session(row)


@router.get("/{session_id}/messages")
async def get_session_messages(
    session_id: UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> list[dict[str, Any]]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        scoped = await srepo.get_by_id_scoped(
            conn, session_id=session_id, founder_id=founder["id"]
        )
        if scoped is None:
            raise HTTPException(status_code=404, detail="session not found")
        rows = await mrepo.list_by_session(conn, session_id=session_id)
    return [
        {
            "id": str(m["id"]),
            "role": m["role"],
            "content": m["content"],
            "created_at": m["created_at"].isoformat(),
        }
        for m in rows
    ]


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        existing = await srepo.get_by_id_scoped(
            conn, session_id=session_id, founder_id=founder["id"]
        )
        if existing is None:
            raise HTTPException(status_code=404, detail="session not found")
        rows = await srepo.complete(
            conn, session_id=session_id, founder_id=founder["id"]
        )
    if rows == 0:
        raise HTTPException(status_code=409, detail="already complete")
    return {"ok": True}
