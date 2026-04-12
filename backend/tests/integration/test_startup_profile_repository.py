import asyncio

import pytest
import pytest_asyncio

from src.db.connection import get_connection
from src.db.repositories import founder_repository as frepo
from src.db.repositories import startup_profile_repository as srepo


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_u_sp() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute("DELETE FROM founders WHERE clerk_user_id = 'u_sp'")


@pytest.mark.asyncio
async def test_ensure_for_founder_concurrent() -> None:
    async with get_connection() as conn:
        f = await frepo.upsert_by_clerk_id(
            conn, clerk_user_id="u_sp", email="a@b.com", name="A", avatar_url=None
        )
    founder_id = f["id"]

    async def one() -> dict[str, object]:
        async with get_connection() as conn:
            return await srepo.ensure_for_founder(conn, founder_id=founder_id)

    results = await asyncio.gather(*[one() for _ in range(10)])
    ids = {r["id"] for r in results}
    assert len(ids) == 1
