# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
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
    BY_KEY,
    CORE_BLUEPRINTS,
    KNOWN_SIGNAL_CATEGORIES,
    KNOWN_SIGNAL_KEYS,
    SessionKey,
    make_deep_dive_blueprint,
)


# Human labels for target-signal keys. Keep in sync with the frontend map.
SIGNAL_LABELS: dict[str, str] = {
    "founder_background": "Your background",
    "product_description": "What you're building",
    "icp": "Who it's for",
    "market_timing": "Why now",
    "pain_points": "Pain points",
    "tam": "Market size",
    "competition_analysis": "Competition",
    "moat": "Unfair advantage",
    "pricing_model": "Pricing",
    "traction_metrics": "Traction",
    "gtm_strategy": "Go-to-market",
    "team_composition": "Team",
    "round_size": "Round size",
    "terms": "Terms",
    "investor_pipeline": "Pipeline",
    "help_needed": "What you need beyond money",
    "mrr_or_revenue": "MRR / revenue",
    "design_partners": "Design partners",
    "unit_economics": "Unit economics",
}

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


@router.get("/{session_id}/coverage")
async def get_session_coverage(
    session_id: UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    """Return overall coverage % plus per-target-signal covered flags."""
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        scoped = await srepo.get_by_id_scoped(
            conn, session_id=session_id, founder_id=founder["id"]
        )
        if scoped is None:
            raise HTTPException(status_code=404, detail="session not found")

        session_type = scoped["session_type"]
        if session_type == "deep_dive":
            blueprint = make_deep_dive_blueprint(
                scoped["target_category"], scoped["target_signal"]
            )
        else:
            blueprint = BY_KEY[SessionKey(session_type)]
        target_signals = list(blueprint.target_signals)

        rows = await conn.fetch(
            """
            SELECT DISTINCT signal_key
            FROM session_signals
            WHERE session_id = $1
              AND signal_key = ANY($2::text[])
            """,
            session_id,
            target_signals,
        )
        covered_keys = {r["signal_key"] for r in rows}

    items = [
        {
            "key": key,
            "label": SIGNAL_LABELS.get(key, key.replace("_", " ").title()),
            "covered": key in covered_keys,
        }
        for key in target_signals
    ]

    return {
        "coverage_score": scoped["coverage_score"],
        "suggest_complete": scoped["suggest_complete"],
        "target_signals": items,
    }


@router.delete("/{session_id}/messages")
async def reset_session_messages(
    session_id: UUID,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    """Delete every message in a session (keeps the session row)."""
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        scoped = await srepo.get_by_id_scoped(
            conn, session_id=session_id, founder_id=founder["id"]
        )
        if scoped is None:
            raise HTTPException(status_code=404, detail="session not found")
        deleted = await mrepo.delete_all_for_session(
            conn, session_id=session_id, founder_id=founder["id"]
        )
    return {"ok": True, "deleted": deleted}


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
