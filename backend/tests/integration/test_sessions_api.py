# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.core.dependencies import verify_clerk_jwt
from src.db.connection import get_connection
from src.db.repositories import founder_repository as frepo
from src.db.repositories import startup_profile_repository as srepo
from src.main import app

# ---------------------------------------------------------------------------
# Fake JWT claims helpers
# ---------------------------------------------------------------------------

_CLERK_ID_A = "u_sess_api_a"
_CLERK_ID_B = "u_sess_api_b"


async def _fake_claims_a() -> dict[str, Any]:
    return {"sub": _CLERK_ID_A, "email": "a@x.com", "name": "A", "image_url": None}


async def _fake_claims_b() -> dict[str, Any]:
    return {"sub": _CLERK_ID_B, "email": "b@x.com", "name": "B", "image_url": None}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


async def _ensure_founder_and_profile(clerk_user_id: str, email: str) -> None:
    async with get_connection() as conn:
        f = await frepo.upsert_by_clerk_id(
            conn,
            clerk_user_id=clerk_user_id,
            email=email,
            name=email.split("@")[0],
            avatar_url=None,
        )
        await srepo.ensure_for_founder(conn, founder_id=f["id"])


@pytest_asyncio.fixture
async def authed_client_a() -> AsyncClient:  # type: ignore[misc]
    await _ensure_founder_and_profile(_CLERK_ID_A, "a@x.com")
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims_a
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client  # type: ignore[misc]
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def authed_client_b() -> AsyncClient:  # type: ignore[misc]
    await _ensure_founder_and_profile(_CLERK_ID_B, "b@x.com")
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims_b
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client  # type: ignore[misc]
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(autouse=True)
async def _cleanup() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id LIKE 'u_sess_api_%'"
        )


_AUTH = {"Authorization": "Bearer x"}


# ---------------------------------------------------------------------------
# Validation tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_session_rejects_unknown_type(
    authed_client_a: AsyncClient,
) -> None:
    r = await authed_client_a.post(
        "/api/sessions", json={"session_type": "nonsense"}, headers=_AUTH
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_create_deep_dive_requires_targets(
    authed_client_a: AsyncClient,
) -> None:
    r = await authed_client_a.post(
        "/api/sessions", json={"session_type": "deep_dive"}, headers=_AUTH
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_create_deep_dive_rejects_unknown_category(
    authed_client_a: AsyncClient,
) -> None:
    r = await authed_client_a.post(
        "/api/sessions",
        json={
            "session_type": "deep_dive",
            "target_category": "NOPE",
            "target_signal": "mrr_or_revenue",
        },
        headers=_AUTH,
    )
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Idempotency / listing / completion
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_session_idempotent_for_active(
    authed_client_a: AsyncClient,
) -> None:
    r1 = await authed_client_a.post(
        "/api/sessions", json={"session_type": "big_picture"}, headers=_AUTH
    )
    assert r1.status_code == 200
    r2 = await authed_client_a.post(
        "/api/sessions", json={"session_type": "big_picture"}, headers=_AUTH
    )
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]


@pytest.mark.asyncio
async def test_list_sessions_includes_created(
    authed_client_a: AsyncClient,
) -> None:
    created = await authed_client_a.post(
        "/api/sessions", json={"session_type": "ask"}, headers=_AUTH
    )
    assert created.status_code == 200
    session_id = created.json()["id"]

    listed = await authed_client_a.get("/api/sessions", headers=_AUTH)
    assert listed.status_code == 200
    ids = [s["id"] for s in listed.json()]
    assert session_id in ids


@pytest.mark.asyncio
async def test_complete_session_is_idempotent_then_conflict(
    authed_client_a: AsyncClient,
) -> None:
    created = await authed_client_a.post(
        "/api/sessions", json={"session_type": "business"}, headers=_AUTH
    )
    assert created.status_code == 200
    sid = created.json()["id"]

    r1 = await authed_client_a.post(
        f"/api/sessions/{sid}/complete", headers=_AUTH
    )
    assert r1.status_code == 200

    r2 = await authed_client_a.post(
        f"/api/sessions/{sid}/complete", headers=_AUTH
    )
    assert r2.status_code == 409


# ---------------------------------------------------------------------------
# Cross-tenant scoping
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_session_cross_tenant_404(
    authed_client_a: AsyncClient,
    authed_client_b: AsyncClient,
) -> None:
    # authed_client_a fixture may have set override; authed_client_b sets its own
    # at its setup. Because httpx fixtures are nested, we explicitly reset.
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims_a
    created = await authed_client_a.post(
        "/api/sessions", json={"session_type": "big_picture"}, headers=_AUTH
    )
    assert created.status_code == 200
    sid = created.json()["id"]

    # Swap to tenant B
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims_b
    r = await authed_client_b.get(f"/api/sessions/{sid}", headers=_AUTH)
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Blueprints / deep-dive recommendation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_blueprints_returns_four_and_excludes_internal_fields(
    authed_client_a: AsyncClient,
) -> None:
    r = await authed_client_a.get("/api/sessions/blueprints", headers=_AUTH)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 4
    for bp in data:
        assert "system_suffix" not in bp
        assert "completion_prompt" not in bp
        assert "key" in bp and "title" in bp and "starter_questions" in bp


@pytest.mark.asyncio
async def test_deep_dive_recommendation_default_for_fresh_founder(
    authed_client_a: AsyncClient,
) -> None:
    r = await authed_client_a.get(
        "/api/sessions/deep-dive/recommendation", headers=_AUTH
    )
    assert r.status_code == 200
    data = r.json()
    assert data["is_default"] is True
    assert data["target_category"] == "problem"
