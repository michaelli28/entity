# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
"""Task 7 integration: chat stream requires session_id + threads blueprint."""
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.core.dependencies import verify_clerk_jwt
from src.db.connection import get_connection
from src.db.repositories import founder_repository as frepo
from src.db.repositories import startup_profile_repository as spr
from src.llm import safety
from src.main import app

_CLERK_ID = "u_chat_sess_1"
_EMAIL = "chatsess@x.com"


async def _fake_claims() -> dict[str, Any]:
    return {"sub": _CLERK_ID, "email": _EMAIL, "name": "Chat Sess", "image_url": None}


async def _ensure_founder_and_profile() -> None:
    async with get_connection() as conn:
        f = await frepo.upsert_by_clerk_id(
            conn,
            clerk_user_id=_CLERK_ID,
            email=_EMAIL,
            name="Chat Sess",
            avatar_url=None,
        )
        await spr.ensure_for_founder(conn, founder_id=f["id"])


@pytest_asyncio.fixture(autouse=True)
async def _cleanup() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id = $1", _CLERK_ID
        )


@pytest_asyncio.fixture
async def authed_client() -> AsyncClient:  # type: ignore[misc]
    await _ensure_founder_and_profile()
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client  # type: ignore[misc]
    app.dependency_overrides.clear()


_AUTH = {"Authorization": "Bearer x"}


# ---------------------------------------------------------------------------
# Fake Claude stream helpers (reused from test_chat_stream.py pattern)
# ---------------------------------------------------------------------------


def _install_fake_claude(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_classify(msg: str) -> safety.Intent:
        return safety.Intent.STARTUP_COACHING

    monkeypatch.setattr("src.api.chat.classify_intent", fake_classify)

    class FakeTextStream:
        async def __aiter__(self):  # type: ignore[override]
            for tok in ["Hello", " there", "!"]:
                yield tok

    class FakeFinalMessage:
        class usage:
            input_tokens = 10
            output_tokens = 3

    class FakeStream:
        text_stream = FakeTextStream()

        async def __aenter__(self) -> "FakeStream":
            return self

        async def __aexit__(self, *args: Any) -> bool:
            return False

        async def get_final_message(self) -> FakeFinalMessage:
            return FakeFinalMessage()

    class FakeMessages:
        def stream(self, **kwargs: Any) -> FakeStream:
            return FakeStream()

    class FakeClient:
        messages = FakeMessages()

    monkeypatch.setattr("src.api.chat.get_client", lambda: FakeClient())


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_missing_session_id_rejected(authed_client: AsyncClient) -> None:
    """POST without session_id must be rejected (pydantic 422 or explicit 400)."""
    r = await authed_client.post(
        "/api/chat/stream", json={"message": "hi"}, headers=_AUTH
    )
    assert r.status_code in (400, 422)


@pytest.mark.asyncio
async def test_chat_stream_with_big_picture_session_includes_blueprint(
    authed_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Creating a big_picture session then streaming with its id succeeds."""
    created = await authed_client.post(
        "/api/sessions", json={"session_type": "big_picture"}, headers=_AUTH
    )
    assert created.status_code == 200, created.text
    session_id = created.json()["id"]

    _install_fake_claude(monkeypatch)

    r = await authed_client.post(
        "/api/chat/stream",
        json={"message": "hi", "session_id": session_id},
        headers=_AUTH,
    )
    assert r.status_code == 200, r.text
    text = r.text
    assert "event: session" in text
    assert "event: done" in text
    assert session_id in text


@pytest.mark.asyncio
async def test_chat_stream_unknown_session_returns_404(
    authed_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _install_fake_claude(monkeypatch)
    # Random uuid not belonging to any session
    r = await authed_client.post(
        "/api/chat/stream",
        json={
            "message": "hi",
            "session_id": "00000000-0000-0000-0000-000000000000",
        },
        headers=_AUTH,
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_chat_stream_completed_session_returns_409(
    authed_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = await authed_client.post(
        "/api/sessions", json={"session_type": "ask"}, headers=_AUTH
    )
    assert created.status_code == 200
    session_id = created.json()["id"]

    completed = await authed_client.post(
        f"/api/sessions/{session_id}/complete", headers=_AUTH
    )
    assert completed.status_code == 200

    _install_fake_claude(monkeypatch)
    r = await authed_client.post(
        "/api/chat/stream",
        json={"message": "hi", "session_id": session_id},
        headers=_AUTH,
    )
    assert r.status_code == 409
