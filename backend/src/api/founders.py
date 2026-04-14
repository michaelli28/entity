# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportReturnType=false
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo
from ..db.repositories import sessions_repository as session_repo
from ..db.repositories import startup_profile_repository as srepo
from ..enrichment.github import fetch_github_profile
from ..integrations import posthog as ph


async def _enrich_github_bg(founder_id: UUID, username: str) -> None:
    data = await fetch_github_profile(username)
    if data is None:
        return
    async with get_connection() as conn:
        await frepo.update_github_data(
            conn, founder_id=founder_id, github_data=data
        )

router = APIRouter(prefix="/api/founders", tags=["founders"])


class PatchFounder(BaseModel):
    name: str | None = None
    linkedin_url: str | None = None
    github_username: str | None = None
    what_would_make_10x: str | None = None
    website_url: str | None = None


class PatchStartup(BaseModel):
    company_name: str | None = None
    one_liner: str | None = None
    stage: str | None = Field(
        default=None,
        pattern=r"^(idea|pre_seed|seed|series_a|series_b_plus)$",
    )
    category: str | None = None


def _to_out(row: dict[str, Any]) -> dict[str, Any]:
    return {
        k: (str(v) if k.endswith("_at") or k == "id" or k.endswith("_id") else v)
        for k, v in row.items()
        if not isinstance(v, bytes)
    }


@router.get("/me")
async def get_me(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        async with conn.transaction():
            founder = await frepo.upsert_by_clerk_id(
                conn,
                clerk_user_id=claims["sub"],
                email=claims.get("email", ""),
                name=claims.get("name") or (claims.get("email") or "").split("@")[0],
                avatar_url=claims.get("image_url"),
            )
            await srepo.ensure_for_founder(conn, founder_id=founder["id"])
        return _to_out(founder)


@router.patch("/me")
async def patch_me(
    body: PatchFounder,
    bg: BackgroundTasks,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        updated = await frepo.update_profile(
            conn,
            founder_id=UUID(str(founder["id"])),
            name=body.name,
            linkedin_url=body.linkedin_url,
            github_username=body.github_username,
            what_would_make_10x=body.what_would_make_10x,
            website_url=body.website_url,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Founder not found")
    if body.github_username and body.github_username != founder.get(
        "github_username"
    ):
        bg.add_task(
            _enrich_github_bg,
            UUID(str(founder["id"])),
            body.github_username,
        )
    return _to_out(updated)


@router.patch("/me/startup")
async def patch_startup(
    body: PatchStartup,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        updated = await srepo.update_for_founder(
            conn,
            founder_id=founder["id"],
            company_name=body.company_name,
            one_liner=body.one_liner,
            stage=body.stage,
            category=body.category,
        )
        return _to_out(updated) if updated else {}


@router.post("/me/complete-onboarding")
async def complete_onboarding(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, str]:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        await frepo.complete_onboarding(conn, UUID(str(founder["id"])))
    ph.capture(claims["sub"], "onboarding_completed")
    return {"status": "ok"}


@router.delete("/me/sessions")
async def delete_all_my_sessions(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    """Hard-delete every mentor session (and cascaded messages) for the caller."""
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        deleted = await session_repo.delete_all_for_founder(
            conn, founder_id=founder["id"]
        )
    ph.capture(claims["sub"], "mentor_history_cleared", {"deleted": deleted})
    return {"ok": True, "deleted": deleted}


@router.post("/me/reset")
async def hard_reset_my_account(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    """Wipe all founder-owned history: sessions, messages, scores,
    cold reads, summaries, commitments, signals. Keeps founder row and
    startup_profile so the user can immediately start fresh."""
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="Founder not found")
        fid = founder["id"]
        async with conn.transaction():
            await conn.execute(
                "DELETE FROM mentor_sessions WHERE founder_id = $1", fid
            )
            await conn.execute(
                """
                DELETE FROM signal_scores
                WHERE startup_profile_id IN (
                    SELECT id FROM startup_profiles WHERE founder_id = $1
                )
                """,
                fid,
            )
            await conn.execute(
                "DELETE FROM cold_reads WHERE founder_id = $1", fid
            )
            await conn.execute(
                "DELETE FROM mentor_session_summaries WHERE founder_id = $1",
                fid,
            )
            await conn.execute(
                "DELETE FROM founder_commitments WHERE founder_id = $1", fid
            )
    ph.capture(claims["sub"], "account_hard_reset", {})
    return {"ok": True}
