import time
import jwt
import httpx
import jwt.algorithms as jwt_algo
from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

security = HTTPBearer()

_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 3600


def _select_signing_key(jwks: dict, kid: str) -> dict | None:
    return next((k for k in jwks["keys"] if k.get("kid") == kid), None)


async def _get_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache, _jwks_fetched_at
    now = time.monotonic()
    if (
        force_refresh
        or _jwks_cache is None
        or (now - _jwks_fetched_at) > _JWKS_TTL_SECONDS
    ):
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(settings.clerk_jwks_url)
            response.raise_for_status()
            _jwks_cache = response.json()
            _jwks_fetched_at = now
    return _jwks_cache


async def verify_clerk_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Invalid token header") from e

    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Missing key id")

    jwks = await _get_jwks()
    key_data = _select_signing_key(jwks, kid)
    if key_data is None:
        jwks = await _get_jwks(force_refresh=True)
        key_data = _select_signing_key(jwks, kid)
        if key_data is None:
            raise HTTPException(status_code=401, detail="Unknown key id")

    signing_key = jwt_algo.RSAAlgorithm.from_jwk(key_data)
    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.clerk_audience if settings.clerk_audience else None,
            options={"verify_aud": bool(settings.clerk_audience)},
        )
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="Token expired") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

    return claims
