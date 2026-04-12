import asyncio

import pytest
import pytest_asyncio

from src.db.connection import get_connection
from src.db.repositories import founder_repository as repo


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_founders() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id IN ('u_test_1', 'u_race')"
        )


@pytest.mark.asyncio
async def test_upsert_is_idempotent() -> None:
    async with get_connection() as conn:
        a = await repo.upsert_by_clerk_id(
            conn,
            clerk_user_id="u_test_1",
            email="t@x.com",
            name="Test",
            avatar_url=None,
        )
        b = await repo.upsert_by_clerk_id(
            conn,
            clerk_user_id="u_test_1",
            email="t@x.com",
            name="Test2",
            avatar_url=None,
        )
        assert a["id"] == b["id"]
        assert b["name"] == "Test2"


@pytest.mark.asyncio
async def test_concurrent_upsert_creates_one_row() -> None:
    async def one() -> dict:  # type: ignore[type-arg]
        async with get_connection() as conn:
            return await repo.upsert_by_clerk_id(
                conn, clerk_user_id="u_race", email="r@x.com", name="R", avatar_url=None
            )

    results = await asyncio.gather(*[one() for _ in range(10)])
    ids = {r["id"] for r in results}
    assert len(ids) == 1
