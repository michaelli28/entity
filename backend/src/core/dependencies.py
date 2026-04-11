from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.config import settings

bearer_scheme = HTTPBearer()

_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.clerk_jwks_url)
            response.raise_for_status()
            _jwks_cache = response.json()
    return _jwks_cache


async def verify_clerk_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwks["keys"][0])
        payload: dict[str, Any] = jwt.decode(
            token,
            key=signing_key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
        )
        return payload
    except (jwt.InvalidTokenError, httpx.HTTPError, KeyError, IndexError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e
