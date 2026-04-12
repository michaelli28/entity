# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownArgumentType=false
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.core.dependencies import verify_clerk_jwt
from src.db.connection import get_connection
from src.db.repositories import founder_repository as frepo
from src.db.repositories import sessions_repository as sessrepo
from src.db.repositories import startup_profile_repository as spr
from src.llm import safety
from src.main import app

_CLERK_ID = "u_chat_1"
_EMAIL = "c@x.com"
_NAME = "Chat Founder"


async def _fake_claims() -> dict[str, Any]:
    return {"sub": _CLERK_ID, "email": _EMAIL, "name": _NAME, "image_url": None}


async def _create_big_picture_session() -> str:
    async with get_connection() as conn:
        f = await frepo.find_by_clerk_id(conn, _CLERK_ID)
        assert f is not None, "founder must be pre-seeded"
        profile = await spr.ensure_for_founder(conn, founder_id=f["id"])
        sess = await sessrepo.create_or_get_active(
            conn,
            founder_id=f["id"],
            startup_profile_id=profile["id"],
            session_type="big_picture",
        )
        return str(sess["id"])


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(autouse=True)
async def _cleanup_chat() -> None:  # type: ignore[misc]
    yield  # type: ignore[misc]
    async with get_connection() as conn:
        await conn.execute(
            "DELETE FROM founders WHERE clerk_user_id = $1", _CLERK_ID
        )


@pytest_asyncio.fixture
async def authed_client() -> AsyncClient:  # type: ignore[misc]
    """Authenticated client with founder pre-seeded via GET /api/founders/me."""
    app.dependency_overrides[verify_clerk_jwt] = _fake_claims
    # Seed the founder row via JIT upsert endpoint
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as seed_client:
        r = await seed_client.get(
            "/api/founders/me", headers={"Authorization": "Bearer x"}
        )
        assert r.status_code == 200, f"Seed founder failed: {r.text}"

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client  # type: ignore[misc]
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_empty_message_returns_400(authed_client: AsyncClient) -> None:
    session_id = await _create_big_picture_session()
    r = await authed_client.post(
        "/api/chat/stream",
        json={"message": "   ", "session_id": session_id},
        headers={"Authorization": "Bearer x"},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_off_topic_returns_canned_response(
    authed_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_classify(msg: str) -> safety.Intent:
        return safety.Intent.OFF_TOPIC

    monkeypatch.setattr("src.api.chat.classify_intent", fake_classify)

    session_id = await _create_big_picture_session()
    r = await authed_client.post(
        "/api/chat/stream",
        json={"message": "what's the weather", "session_id": session_id},
        headers={"Authorization": "Bearer x"},
    )
    assert r.status_code == 200
    text = r.text
    assert "event: session" in text
    assert "event: token" in text
    assert "event: done" in text
    # canned response text is streamed char-by-char; check raw SSE body
    # contains the word fragments (each char is its own token event)
    assert '"finish_reason": "canned"' in text


@pytest.mark.asyncio
async def test_coaching_path_streams_mocked_claude_tokens(
    authed_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_classify(msg: str) -> safety.Intent:
        return safety.Intent.STARTUP_COACHING

    monkeypatch.setattr("src.api.chat.classify_intent", fake_classify)

    # Minimal fake of the Anthropic streaming context manager
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

    session_id = await _create_big_picture_session()
    r = await authed_client.post(
        "/api/chat/stream",
        json={
            "message": "We're a B2B SaaS targeting SMBs",
            "session_id": session_id,
        },
        headers={"Authorization": "Bearer x"},
    )
    assert r.status_code == 200
    text = r.text
    assert "Hello" in text
    assert "there" in text
    assert "event: done" in text
    assert '"finish_reason": "stop"' in text
