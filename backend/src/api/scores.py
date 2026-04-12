# pyright: reportMissingTypeStubs=false
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo
from ..db.repositories import scores_repository as srepo

router = APIRouter(prefix="/api/scores", tags=["scores"])


CATEGORIES = (
    "founder",
    "market",
    "problem",
    "competition",
    "product",
    "traction",
    "pricing",
    "team",
)


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
