# pyright: reportUnknownMemberType=false
import pytest
import pytest_asyncio

from src.db.connection import get_connection
from src.db.repositories import cold_read_repository as crepo
from src.db.repositories import founder_repository as frepo
from src.db.repositories import mentor_repository as mrepo
from src.db.repositories import startup_profile_repository as srepo


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_cr() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute("DELETE FROM founders WHERE clerk_user_id = 'u_cr'")


async def _seed_founder_and_session() -> tuple[object, object]:
    async with get_connection() as conn:
        f = await frepo.upsert_by_clerk_id(
            conn, clerk_user_id="u_cr", email="cr@x.com", name="CR", avatar_url=None
        )
        sp = await srepo.ensure_for_founder(conn, founder_id=f["id"])
        s = await mrepo.ensure_session(
            conn, founder_id=f["id"], startup_profile_id=sp["id"]
        )
        return f["id"], s["id"]


@pytest.mark.asyncio
async def test_create_and_latest() -> None:
    founder_id, session_id = await _seed_founder_and_session()
    async with get_connection() as conn:
        cr = await crepo.create(
            conn,
            founder_id=founder_id,
            session_id=session_id,
            what_i_heard="Summary",
            investor_pushback=["p1", "p2", "p3"],
            three_unanswered_questions=["q1", "q2", "q3"],
        )
        assert cr["what_i_heard"] == "Summary"
        assert cr["public_slug"]
        latest = await crepo.latest_for_founder(conn, founder_id)
        assert latest and latest["id"] == cr["id"]


@pytest.mark.asyncio
async def test_get_by_id_scoped_to_founder() -> None:
    founder_id, session_id = await _seed_founder_and_session()
    async with get_connection() as conn:
        cr = await crepo.create(
            conn,
            founder_id=founder_id,
            session_id=session_id,
            what_i_heard="S",
            investor_pushback=["a", "b", "c"],
            three_unanswered_questions=["x", "y", "z"],
        )
        got = await crepo.get_by_id(conn, cr["id"], founder_id)
        assert got is not None
        assert got["id"] == cr["id"]


@pytest.mark.asyncio
async def test_get_by_slug_returns_joined_fields() -> None:
    founder_id, session_id = await _seed_founder_and_session()
    async with get_connection() as conn:
        cr = await crepo.create(
            conn,
            founder_id=founder_id,
            session_id=session_id,
            what_i_heard="S",
            investor_pushback=["a", "b", "c"],
            three_unanswered_questions=["x", "y", "z"],
        )
        got = await crepo.get_by_slug(conn, cr["public_slug"])
        assert got is not None
        assert got["founder_name"] == "CR"
