# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportUntypedFunctionDecorator=false
from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import commitment_repository as comrepo
from ..db.repositories import founder_repository as frepo
from ..db.repositories import startup_profile_repository as srepo

router = APIRouter(prefix="/api/founders", tags=["export"])


def _jsonable(value: Any) -> Any:
    if isinstance(value, UUID | datetime):
        return str(value)
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    return value


@router.get("/me/export")
async def export_me(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> JSONResponse:
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(404, "Founder not found")
        profile = await srepo.get_by_founder(conn, founder["id"])
        sessions = await conn.fetch(
            "SELECT * FROM mentor_sessions WHERE founder_id = $1",
            founder["id"],
        )
        messages = await conn.fetch(
            """
            SELECT m.* FROM mentor_messages m
            JOIN mentor_sessions s ON s.id = m.session_id
            WHERE s.founder_id = $1
            """,
            founder["id"],
        )
        cold_reads = await conn.fetch(
            "SELECT * FROM cold_reads WHERE founder_id = $1", founder["id"]
        )
        commitments = await comrepo.list_open(conn, founder["id"])

    payload: dict[str, Any] = {
        "founder": _jsonable(founder),
        "startup_profile": _jsonable(profile),
        "sessions": [_jsonable(dict(s)) for s in sessions],
        "messages": [_jsonable(dict(m)) for m in messages],
        "cold_reads": [_jsonable(dict(c)) for c in cold_reads],
        "commitments": [_jsonable(c) for c in commitments],
    }
    return JSONResponse(
        content=payload,
        headers={
            "Content-Disposition": "attachment; filename=zstar-export.json"
        },
    )
