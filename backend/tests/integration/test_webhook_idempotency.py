import pytest
import pytest_asyncio

from src.db.connection import get_connection
from src.db.repositories import webhook_idempotency_repository as wrepo


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_evt():
    yield
    async with get_connection() as conn:
        await conn.execute("DELETE FROM processed_webhooks WHERE event_id = 'evt_1'")


@pytest.mark.asyncio
async def test_claim_event_id_once():
    async with get_connection() as conn:
        assert await wrepo.claim_event_id(conn, "evt_1") is True
        assert await wrepo.claim_event_id(conn, "evt_1") is False
