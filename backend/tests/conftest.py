import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.db.connection import close_pool, init_pool
from src.main import app


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _db_pool() -> None:  # type: ignore[misc]
    await init_pool()
    yield  # type: ignore[misc]
    await close_pool()


@pytest.fixture
async def client() -> AsyncClient:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
