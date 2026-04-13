# pyright: reportMissingTypeStubs=false
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..core.categories import CATEGORIES
from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo
from ..db.repositories import mentor_repository as mrepo
from ..db.repositories import scores_repository as srepo
from ..db.repositories import sessions_repository as sessrepo
from ..db.repositories import startup_profile_repository as sppo
from ..llm.extractors import generate_mentor_summary

router = APIRouter(prefix="/api/scores", tags=["scores"])




def _normalize_category_scores(raw: Any) -> dict[str, int]:
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except (ValueError, TypeError):
            raw = {}
    if not isinstance(raw, dict):
        raw = {}
    out: dict[str, int] = {}
    for c in CATEGORIES:
        v = raw.get(c)
        if isinstance(v, (int, float)):
            out[c] = max(0, min(100, int(v)))
        else:
            out[c] = 0
    return out


@router.get("/latest")
async def get_latest_scores(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        row = await srepo.latest_for_founder(conn, founder_id=founder["id"])
    if row is None:
        return {
            "overall_score": None,
            "category_scores": {c: 0 for c in CATEGORIES},
            "computed_at": None,
            "present": False,
        }
    return {
        "overall_score": row["overall_score"],
        "category_scores": _normalize_category_scores(row["category_scores"]),
        "computed_at": row["computed_at"].isoformat(),
        "present": True,
    }


SESSION_TYPE_LABELS = {
    "big_picture": "The Big Picture",
    "problem_market": "The Problem & Market",
    "business": "The Business",
    "ask": "The Ask",
    "deep_dive": "Deep Dive",
}


@router.get("/mentor-summary")
async def get_mentor_summary(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    """Holistic, brutally-honest coaching summary across all sessions."""
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        profile = await sppo.get_by_founder(conn, founder["id"]) or {}
        score_row = await srepo.latest_for_founder(conn, founder_id=founder["id"])
        sessions = await sessrepo.list_by_founder(conn, founder_id=founder["id"])

        transcripts: list[str] = []
        for s in sessions:
            if s["session_type"] == "deep_dive":
                continue
            label = SESSION_TYPE_LABELS.get(s["session_type"], s["session_type"])
            msgs = await mrepo.list_by_session(conn, s["id"], limit=100)
            if not msgs:
                continue
            lines = [f"--- {label} ---"]
            for m in msgs:
                role = "Founder" if m["role"] == "user" else "Mentor"
                lines.append(f"{role}: {m['content']}")
            transcripts.append("\n".join(lines))

    if not transcripts:
        raise HTTPException(
            status_code=400,
            detail="No session transcripts yet. Complete at least one mentor "
            "session before requesting a holistic summary.",
        )

    profile_blob = (
        f"Name: {founder.get('name', 'unknown')}\n"
        f"Company: {profile.get('company_name', 'unknown')}\n"
        f"One-liner: {profile.get('one_liner', 'unknown')}\n"
        f"Stage: {profile.get('stage', 'unknown')}\n"
        f"What would 10x this for them: {founder.get('what_would_make_10x') or 'not specified'}\n"
    )

    if score_row is None:
        scores_blob = "No signal scores computed yet."
    else:
        cats = _normalize_category_scores(score_row["category_scores"])
        cat_lines = "\n".join(f"- {k}: {v}/100" for k, v in cats.items())
        scores_blob = (
            f"Overall: {score_row['overall_score']}/100\n{cat_lines}"
        )

    transcripts_blob = "\n\n".join(transcripts)[:40000]

    summary = await generate_mentor_summary(
        profile_blob=profile_blob,
        scores_blob=scores_blob,
        transcripts_blob=transcripts_blob,
    )
    return summary.model_dump()
