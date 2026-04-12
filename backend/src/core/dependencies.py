import asyncio
import time
from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

security = HTTPBearer()

_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 3600
_jwks_lock = asyncio.Lock()


def _select_signing_key(jwks: dict[str, Any], kid: str) -> dict[str, Any] | None:
    return next((k for k in jwks["keys"] if k.get("kid") == kid), None)


async def _get_jwks(force_refresh: bool = False) -> dict[str, Any]:
    global _jwks_cache, _jwks_fetched_at
    now = time.monotonic()
    if (
        not force_refresh
        and _jwks_cache is not None
        and (now - _jwks_fetched_at) <= _JWKS_TTL_SECONDS
    ):
        return _jwks_cache
    async with _jwks_lock:
        now = time.monotonic()
        if (
            not force_refresh
            and _jwks_cache is not None
            and (now - _jwks_fetched_at) <= _JWKS_TTL_SECONDS
        ):
            return _jwks_cache
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(settings.clerk_jwks_url)
            response.raise_for_status()
            _jwks_cache = response.json()
            _jwks_fetched_at = now
    assert _jwks_cache is not None
    return _jwks_cache


async def verify_clerk_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(security),  # noqa: B008
) -> dict[str, Any]:
    token = credentials.credentials
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Invalid token header") from e

    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Missing key id")

    try:
        jwks = await _get_jwks()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail="Auth service unavailable") from e

    key_data = _select_signing_key(jwks, kid)
    if key_data is None:
        try:
            jwks = await _get_jwks(force_refresh=True)
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=503, detail="Auth service unavailable"
            ) from e
        key_data = _select_signing_key(jwks, kid)
        if key_data is None:
            raise HTTPException(status_code=401, detail="Unknown key id")

    signing_key = jwt.PyJWK.from_dict(key_data)

    decode_kwargs: dict[str, Any] = {"algorithms": ["RS256"]}
    if settings.clerk_audience:
        decode_kwargs["audience"] = settings.clerk_audience
    if settings.clerk_issuer:
        decode_kwargs["issuer"] = settings.clerk_issuer

    try:
        claims: dict[str, Any] = jwt.decode(token, signing_key, **decode_kwargs)
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="Token expired") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

    return claims
