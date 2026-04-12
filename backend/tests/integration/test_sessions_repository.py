# pyright: reportUnknownMemberType=false
import pytest
import pytest_asyncio

from src.db.connection import get_connection
from src.db.repositories import founder_repository as frepo
from src.db.repositories import sessions_repository as srepo
from src.db.repositories import startup_profile_repository as sprepo
from src.llm.mentor_sessions import SessionKey


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_sessions() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id IN ('u_sessions', 'u_sessions_other')"
        )


async def _make_founder_and_profile(
    clerk_user_id: str = "u_sessions",
    email: str = "s@x.com",
) -> tuple[object, object]:
    async with get_connection() as conn:
        f = await frepo.upsert_by_clerk_id(
            conn,
            clerk_user_id=clerk_user_id,
            email=email,
            name="S",
            avatar_url=None,
        )
        sp = await sprepo.ensure_for_founder(conn, founder_id=f["id"])
        return f["id"], sp["id"]


@pytest.mark.asyncio
async def test_create_or_get_creates_when_missing() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s = await srepo.create_or_get_active(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_type=SessionKey.BIG_PICTURE.value,
        )
        assert s["session_type"] == "big_picture"
        assert s["completed_at"] is None


@pytest.mark.asyncio
async def test_create_or_get_returns_existing() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s1 = await srepo.create_or_get_active(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_type=SessionKey.BIG_PICTURE.value,
        )
        s2 = await srepo.create_or_get_active(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_type=SessionKey.BIG_PICTURE.value,
        )
        assert s1["id"] == s2["id"]


@pytest.mark.asyncio
async def test_get_by_id_scoped_cross_tenant_returns_none() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    other_founder_id, _ = await _make_founder_and_profile(
        clerk_user_id="u_sessions_other",
        email="other@x.com",
    )
    async with get_connection() as conn:
        s = await srepo.create_or_get_active(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_type=SessionKey.ASK.value,
        )
        leaked = await srepo.get_by_id_scoped(
            conn, session_id=s["id"], founder_id=other_founder_id
        )
        assert leaked is None


@pytest.mark.asyncio
async def test_update_coverage_is_monotonic() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s = await srepo.create_or_get_active(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_type=SessionKey.BIG_PICTURE.value,
        )
        await srepo.update_coverage(
            conn,
            session_id=s["id"],
            founder_id=founder_id,
            new_score=80,
            threshold=75,
            user_turn_count=5,
            min_turns=3,
        )
        await srepo.update_coverage(
            conn,
            session_id=s["id"],
            founder_id=founder_id,
            new_score=20,
            threshold=75,
            user_turn_count=5,
            min_turns=3,
        )
        refreshed = await srepo.get_by_id_scoped(
            conn, session_id=s["id"], founder_id=founder_id
        )
        assert refreshed is not None
        assert refreshed["coverage_score"] == 80
        assert refreshed["suggest_complete"] is True


@pytest.mark.asyncio
async def test_update_coverage_respects_min_turn_floor() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s = await srepo.create_or_get_active(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_type=SessionKey.BIG_PICTURE.value,
        )
        await srepo.update_coverage(
            conn,
            session_id=s["id"],
            founder_id=founder_id,
            new_score=90,
            threshold=75,
            user_turn_count=2,
            min_turns=3,
        )
        refreshed = await srepo.get_by_id_scoped(
            conn, session_id=s["id"], founder_id=founder_id
        )
        assert refreshed is not None
        assert refreshed["suggest_complete"] is False


@pytest.mark.asyncio
async def test_complete_sets_completed_at_once() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s = await srepo.create_or_get_active(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_type=SessionKey.BIG_PICTURE.value,
        )
        rows1 = await srepo.complete(
            conn, session_id=s["id"], founder_id=founder_id
        )
        rows2 = await srepo.complete(
            conn, session_id=s["id"], founder_id=founder_id
        )
        assert rows1 == 1
        assert rows2 == 0
