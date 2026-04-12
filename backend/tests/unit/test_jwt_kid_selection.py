import time

import httpx
import pytest

import src.core.dependencies as deps
from src.core.dependencies import _select_signing_key

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FAKE_JWKS = {
    "keys": [
        {"kid": "kid-old", "kty": "RSA", "n": "...", "e": "AQAB"},
        {"kid": "kid-new", "kty": "RSA", "n": "...", "e": "AQAB"},
    ]
}


def _reset_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    """Reset module-level JWKS globals between tests."""
    monkeypatch.setattr(deps, "_jwks_cache", None)
    monkeypatch.setattr(deps, "_jwks_fetched_at", 0.0)


# ---------------------------------------------------------------------------
# _select_signing_key
# ---------------------------------------------------------------------------


def test_select_signing_key_matches_kid() -> None:
    assert _select_signing_key(FAKE_JWKS, "kid-new")["kid"] == "kid-new"


def test_select_signing_key_returns_none_on_miss() -> None:
    jwks = {"keys": [{"kid": "kid-other", "kty": "RSA", "n": "...", "e": "AQAB"}]}
    assert _select_signing_key(jwks, "missing-kid") is None


# ---------------------------------------------------------------------------
# _get_jwks — caching behaviour
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_jwks_fetches_and_caches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _reset_cache(monkeypatch)
    call_count = 0

    async def fake_get(url: str) -> object:
        nonlocal call_count
        call_count += 1

        class FakeResponse:
            def raise_for_status(self) -> None:
                pass

            def json(self) -> dict:
                return FAKE_JWKS

        return FakeResponse()

    monkeypatch.setattr(
        deps.settings,
        "clerk_jwks_url",
        "https://example.com/.well-known/jwks.json",
    )

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: object) -> None:
            pass

        async def get(self, url: str) -> object:
            return await fake_get(url)

    monkeypatch.setattr(httpx, "AsyncClient", lambda **_: FakeClient())

    result = await deps._get_jwks()
    assert result == FAKE_JWKS
    assert call_count == 1


@pytest.mark.asyncio
async def test_get_jwks_caches_within_ttl(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _reset_cache(monkeypatch)
    call_count = 0

    class FakeResponse:
        def raise_for_status(self) -> None:
            pass

        def json(self) -> dict:
            return FAKE_JWKS

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: object) -> None:
            pass

        async def get(self, url: str) -> FakeResponse:
            nonlocal call_count
            call_count += 1
            return FakeResponse()

    monkeypatch.setattr(httpx, "AsyncClient", lambda **_: FakeClient())
    monkeypatch.setattr(
        deps.settings,
        "clerk_jwks_url",
        "https://example.com/.well-known/jwks.json",
    )

    await deps._get_jwks()
    await deps._get_jwks()

    assert call_count == 1, "Second call within TTL must not re-fetch"


@pytest.mark.asyncio
async def test_get_jwks_refetches_after_ttl(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _reset_cache(monkeypatch)
    call_count = 0

    class FakeResponse:
        def raise_for_status(self) -> None:
            pass

        def json(self) -> dict:
            return FAKE_JWKS

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: object) -> None:
            pass

        async def get(self, url: str) -> FakeResponse:
            nonlocal call_count
            call_count += 1
            return FakeResponse()

    monkeypatch.setattr(httpx, "AsyncClient", lambda **_: FakeClient())
    monkeypatch.setattr(
        deps.settings,
        "clerk_jwks_url",
        "https://example.com/.well-known/jwks.json",
    )

    # Prime the cache then rewind the timestamp past TTL
    await deps._get_jwks()
    expired_at = time.monotonic() - deps._JWKS_TTL_SECONDS - 1
    monkeypatch.setattr(deps, "_jwks_fetched_at", expired_at)

    await deps._get_jwks()
    assert call_count == 2, "Expired cache must trigger re-fetch"


@pytest.mark.asyncio
async def test_get_jwks_force_refresh_bypasses_cache(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _reset_cache(monkeypatch)
    call_count = 0

    class FakeResponse:
        def raise_for_status(self) -> None:
            pass

        def json(self) -> dict:
            return FAKE_JWKS

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: object) -> None:
            pass

        async def get(self, url: str) -> FakeResponse:
            nonlocal call_count
            call_count += 1
            return FakeResponse()

    monkeypatch.setattr(httpx, "AsyncClient", lambda **_: FakeClient())
    monkeypatch.setattr(
        deps.settings,
        "clerk_jwks_url",
        "https://example.com/.well-known/jwks.json",
    )

    # Prime cache so it is valid
    await deps._get_jwks()
    assert call_count == 1

    # force_refresh=True must fetch even though cache is fresh
    await deps._get_jwks(force_refresh=True)
    assert call_count == 2, "force_refresh must bypass TTL check"


# ---------------------------------------------------------------------------
# verify_clerk_jwt — edge-case behaviour
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_verify_clerk_jwt_missing_kid_header(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Token with no kid in header must return 401."""
    import jwt as pyjwt
    from fastapi import HTTPException
    from fastapi.security import HTTPAuthorizationCredentials

    _reset_cache(monkeypatch)

    # Build a token without a kid header — kid check fires before RS256 decode.
    token = pyjwt.encode({"sub": "user_1"}, "secret", algorithm="HS256", headers={})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(HTTPException) as exc_info:
        await deps.verify_clerk_jwt(credentials)

    assert exc_info.value.status_code == 401
    assert "Missing key id" in exc_info.value.detail


@pytest.mark.asyncio
async def test_verify_clerk_jwt_unknown_kid_after_refresh(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Unknown kid — even after forced JWKS refresh — must return 401."""
    import jwt as pyjwt
    from fastapi import HTTPException
    from fastapi.security import HTTPAuthorizationCredentials

    _reset_cache(monkeypatch)

    token = pyjwt.encode(
        {"sub": "user_1"},
        "secret",
        algorithm="HS256",
        headers={"kid": "kid-unknown"},
    )
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    class FakeResponse:
        def raise_for_status(self) -> None:
            pass

        def json(self) -> dict:
            # JWKS that does NOT contain "kid-unknown"
            return {"keys": [{"kid": "kid-other", "kty": "RSA", "n": "x", "e": "AQAB"}]}

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: object) -> None:
            pass

        async def get(self, url: str) -> FakeResponse:
            return FakeResponse()

    monkeypatch.setattr(httpx, "AsyncClient", lambda **_: FakeClient())
    monkeypatch.setattr(
        deps.settings,
        "clerk_jwks_url",
        "https://example.com/.well-known/jwks.json",
    )

    with pytest.raises(HTTPException) as exc_info:
        await deps.verify_clerk_jwt(credentials)

    assert exc_info.value.status_code == 401
    assert "Unknown key id" in exc_info.value.detail


@pytest.mark.asyncio
async def test_verify_clerk_jwt_jwks_unreachable_returns_503(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When the JWKS endpoint is unreachable the response must be 503."""
    import jwt as pyjwt
    from fastapi import HTTPException
    from fastapi.security import HTTPAuthorizationCredentials

    _reset_cache(monkeypatch)

    token = pyjwt.encode(
        {"sub": "user_1"},
        "secret",
        algorithm="HS256",
        headers={"kid": "kid-any"},
    )
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *_: object) -> None:
            pass

        async def get(self, url: str) -> None:
            raise httpx.ConnectError("connection refused")

    monkeypatch.setattr(httpx, "AsyncClient", lambda **_: FakeClient())
    monkeypatch.setattr(
        deps.settings,
        "clerk_jwks_url",
        "https://example.com/.well-known/jwks.json",
    )

    with pytest.raises(HTTPException) as exc_info:
        await deps.verify_clerk_jwt(credentials)

    assert exc_info.value.status_code == 503
    assert "Auth service unavailable" in exc_info.value.detail
