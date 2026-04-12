# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.db.connection import get_connection
from src.main import app


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_webhooks() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id IN ('u_wh_1', 'u_wh_2')"
        )
        await conn.execute(
            "DELETE FROM processed_webhooks"
            " WHERE event_id IN ('evt_wh_1', 'evt_wh_dup')"
        )


def _fake_verify_factory(
    event_type: str, clerk_id: str, email: str = "wh@x.com"
) -> Any:
    async def fake_verify(request: Any) -> dict[str, Any]:
        return {
            "type": event_type,
            "data": {
                "id": clerk_id,
                "email_addresses": [{"email_address": email}],
                "first_name": "W",
                "last_name": "H",
                "image_url": None,
            },
        }

    return fake_verify


@pytest.mark.asyncio
async def test_user_created_inserts_founder(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "src.api.auth._verify_webhook",
        _fake_verify_factory("user.created", "u_wh_1"),
    )
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r = await client.post(
            "/api/webhooks/clerk",
            headers={
                "svix-id": "evt_wh_1",
                "svix-timestamp": "1",
                "svix-signature": "x",
            },
            json={},
        )
        assert r.status_code == 200

    async with get_connection() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM founders WHERE clerk_user_id = 'u_wh_1'"
        )
        assert row is not None


@pytest.mark.asyncio
async def test_replayed_event_id_is_skipped(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "src.api.auth._verify_webhook",
        _fake_verify_factory("user.created", "u_wh_2"),
    )
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        headers = {
            "svix-id": "evt_wh_dup",
            "svix-timestamp": "1",
            "svix-signature": "x",
        }
        r1 = await client.post("/api/webhooks/clerk", headers=headers, json={})
        r2 = await client.post("/api/webhooks/clerk", headers=headers, json={})
        assert r1.status_code == 200
        assert r2.status_code == 200

    async with get_connection() as conn:
        rows = await conn.fetch(
            "SELECT * FROM founders WHERE clerk_user_id = 'u_wh_2'"
        )
        assert len(rows) == 1  # second event was replay-skipped
