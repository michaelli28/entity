# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.core.dependencies import verify_clerk_jwt
from src.db.connection import get_connection
from src.main import app

# ---------------------------------------------------------------------------
# Fake JWT claims helpers
# ---------------------------------------------------------------------------

_CLERK_ID = "u_jit_1"
_EMAIL = "jit@x.com"
_NAME = "JIT Founder"


async def _fake_claims() -> dict[str, Any]:
    return {"sub": _CLERK_ID, "email": _EMAIL, "name": _NAME, "image_url": None}


async def _fake_claims_2() -> dict[str, Any]:
    return {
        "sub": "u_jit_2",
        "email": "jit2@x.com",
        "name": "Second Founder",
        "image_url": None,
    }


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def authed_client() -> AsyncClient:  # type: ignore[misc]
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client  # type: ignore[misc]
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def authed_client_2() -> AsyncClient:  # type: ignore[misc]
    """Second authenticated client — different clerk_id, no pre-existing founder."""
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims_2
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client  # type: ignore[misc]
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def unauthed_client() -> AsyncClient:  # type: ignore[misc]
    """Client with no dependency override — auth header required."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client  # type: ignore[misc]


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_jit() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id LIKE 'u_jit_%'"
        )


# ---------------------------------------------------------------------------
# GET /api/founders/me
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_me_creates_founder_jit(authed_client: AsyncClient) -> None:
    """GET /me upserts a founder row on first call (just-in-time creation)."""
    r = await authed_client.get("/api/founders/me")
    assert r.status_code == 200
    data = r.json()
    assert data["clerk_user_id"] == _CLERK_ID
    assert data["email"] == _EMAIL
    assert "id" in data  # UUIDv7 serialised as string

    # Idempotent — second call returns the same founder
    r2 = await authed_client.get("/api/founders/me")
    assert r2.status_code == 200
    assert r2.json()["id"] == data["id"]


@pytest.mark.asyncio
async def test_get_me_ensures_startup_profile(authed_client: AsyncClient) -> None:
    """GET /me creates a startup_profile row for the new founder."""
    r = await authed_client.get("/api/founders/me")
    assert r.status_code == 200
    founder_id = r.json()["id"]

    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM startup_profiles WHERE founder_id = $1::uuid",
            founder_id,
        )
    assert row is not None


@pytest.mark.asyncio
async def test_get_me_uses_email_prefix_as_name_fallback(
    authed_client: AsyncClient,
) -> None:
    """When name claim is empty the email prefix is used."""
    async def _no_name_claims() -> dict[str, Any]:
        return {
            "sub": _CLERK_ID,
            "email": "prefix@x.com",
            "name": "",
            "image_url": None,
        }

    app.dependency_overrides[verify_clerk_jwt] = _no_name_claims
    r = await authed_client.get("/api/founders/me")
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims  # restore
    assert r.status_code == 200
    assert r.json()["name"] == "prefix"


# ---------------------------------------------------------------------------
# PATCH /api/founders/me
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_patch_me_updates_profile_fields(authed_client: AsyncClient) -> None:
    """PATCH /me updates name, linkedin_url, github_username, what_would_make_10x."""
    # Ensure founder exists first
    await authed_client.get("/api/founders/me")

    r = await authed_client.patch(
        "/api/founders/me",
        json={
            "name": "Updated Name",
            "linkedin_url": "https://linkedin.com/in/jit",
            "github_username": "jitfounder",
            "what_would_make_10x": "hiring 10 senior engineers",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Updated Name"
    assert data["linkedin_url"] == "https://linkedin.com/in/jit"
    assert data["github_username"] == "jitfounder"
    assert data["what_would_make_10x"] == "hiring 10 senior engineers"


@pytest.mark.asyncio
async def test_patch_me_partial_update_preserves_other_fields(
    authed_client: AsyncClient,
) -> None:
    """PATCH with only some fields does not null out other fields."""
    await authed_client.get("/api/founders/me")
    await authed_client.patch(
        "/api/founders/me",
        json={"linkedin_url": "https://linkedin.com/in/first"},
    )
    r = await authed_client.patch("/api/founders/me", json={"github_username": "gh"})
    assert r.status_code == 200
    data = r.json()
    assert data["linkedin_url"] == "https://linkedin.com/in/first"
    assert data["github_username"] == "gh"


@pytest.mark.asyncio
async def test_patch_me_returns_404_when_no_founder(
    authed_client_2: AsyncClient,
) -> None:
    """PATCH /me returns 404 when the founder has not been created yet."""
    r = await authed_client_2.patch("/api/founders/me", json={"name": "Ghost"})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# PATCH /api/founders/me/startup
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_patch_startup_updates_fields(authed_client: AsyncClient) -> None:
    """PATCH /me/startup updates company_name, one_liner, stage, category."""
    await authed_client.get("/api/founders/me")

    r = await authed_client.patch(
        "/api/founders/me/startup",
        json={
            "company_name": "Acme AI",
            "one_liner": "AI for everyone",
            "stage": "seed",
            "category": "developer-tools",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["company_name"] == "Acme AI"
    assert data["one_liner"] == "AI for everyone"
    assert data["stage"] == "seed"


@pytest.mark.asyncio
async def test_patch_startup_rejects_invalid_stage(authed_client: AsyncClient) -> None:
    """An invalid stage value returns 422 Unprocessable Entity."""
    await authed_client.get("/api/founders/me")

    r = await authed_client.patch(
        "/api/founders/me/startup",
        json={"stage": "unicorn"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_patch_startup_accepts_series_b_plus(authed_client: AsyncClient) -> None:
    """series_b_plus is a valid stage (not series_b+)."""
    await authed_client.get("/api/founders/me")

    r = await authed_client.patch(
        "/api/founders/me/startup",
        json={"stage": "series_b_plus"},
    )
    assert r.status_code == 200
    assert r.json()["stage"] == "series_b_plus"


@pytest.mark.asyncio
async def test_patch_startup_returns_404_when_no_founder(
    authed_client_2: AsyncClient,
) -> None:
    """PATCH /me/startup returns 404 when the founder does not exist."""
    r = await authed_client_2.patch(
        "/api/founders/me/startup", json={"company_name": "Ghost Corp"}
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/founders/me/complete-onboarding
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_complete_onboarding_sets_timestamp(authed_client: AsyncClient) -> None:
    """POST /me/complete-onboarding marks the founder's onboarding as done."""
    await authed_client.get("/api/founders/me")

    r = await authed_client.post("/api/founders/me/complete-onboarding")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT onboarding_completed_at FROM founders"
            " WHERE clerk_user_id = $1",
            _CLERK_ID,
        )
    assert row is not None
    assert row["onboarding_completed_at"] is not None


@pytest.mark.asyncio
async def test_complete_onboarding_returns_404_when_no_founder(
    authed_client_2: AsyncClient,
) -> None:
    """POST /me/complete-onboarding returns 404 when the founder does not exist."""
    r = await authed_client_2.post("/api/founders/me/complete-onboarding")
    assert r.status_code == 404
