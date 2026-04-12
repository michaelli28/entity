# pyright: reportUnknownMemberType=false
import pytest
import pytest_asyncio

from src.db.connection import get_connection
from src.db.repositories import founder_repository as frepo
from src.db.repositories import mentor_repository as mrepo
from src.db.repositories import startup_profile_repository as sprepo


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_mentor() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id = 'u_mentor'"
        )


async def _make_founder_and_profile() -> tuple[object, object]:
    async with get_connection() as conn:
        f = await frepo.upsert_by_clerk_id(
            conn,
            clerk_user_id="u_mentor",
            email="m@x.com",
            name="M",
            avatar_url=None,
        )
        sp = await sprepo.ensure_for_founder(conn, founder_id=f["id"])
        return f["id"], sp["id"]


@pytest.mark.asyncio
async def test_ensure_session_creates_new_when_no_id() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s = await mrepo.ensure_session(
            conn, founder_id=founder_id, startup_profile_id=profile_id
        )
        assert s["id"] is not None
        assert s["founder_id"] == founder_id
        assert s["startup_profile_id"] == profile_id
        assert s["session_type"] == "big_picture"


@pytest.mark.asyncio
async def test_ensure_session_returns_existing_when_id_matches() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s1 = await mrepo.ensure_session(
            conn, founder_id=founder_id, startup_profile_id=profile_id
        )
        s2 = await mrepo.ensure_session(
            conn,
            founder_id=founder_id,
            startup_profile_id=profile_id,
            session_id=s1["id"],
        )
        assert s1["id"] == s2["id"]


@pytest.mark.asyncio
async def test_insert_and_recent_messages_ordering() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s = await mrepo.ensure_session(
            conn, founder_id=founder_id, startup_profile_id=profile_id
        )
        await mrepo.insert_message(conn, s["id"], role="user", content="hi")
        await mrepo.insert_message(conn, s["id"], role="assistant", content="hello")
        await mrepo.insert_message(conn, s["id"], role="user", content="thanks")
        msgs = await mrepo.recent_messages(conn, s["id"], limit=10)
        assert [m["content"] for m in msgs] == ["hi", "hello", "thanks"]


@pytest.mark.asyncio
async def test_turn_count_only_counts_user_messages() -> None:
    founder_id, profile_id = await _make_founder_and_profile()
    async with get_connection() as conn:
        s = await mrepo.ensure_session(
            conn, founder_id=founder_id, startup_profile_id=profile_id
        )
        await mrepo.insert_message(conn, s["id"], role="user", content="a")
        await mrepo.insert_message(conn, s["id"], role="assistant", content="b")
        await mrepo.insert_message(conn, s["id"], role="user", content="c")
        count = await mrepo.turn_count(conn, s["id"])
        assert count == 2
