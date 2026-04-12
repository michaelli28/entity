import pytest
from unittest.mock import AsyncMock, patch
from src.core.dependencies import _select_signing_key


def test_select_signing_key_matches_kid():
    jwks = {"keys": [
        {"kid": "kid-old", "kty": "RSA", "n": "...", "e": "AQAB"},
        {"kid": "kid-new", "kty": "RSA", "n": "...", "e": "AQAB"},
    ]}
    assert _select_signing_key(jwks, "kid-new")["kid"] == "kid-new"


def test_select_signing_key_returns_none_on_miss():
    jwks = {"keys": [{"kid": "kid-other", "kty": "RSA", "n": "...", "e": "AQAB"}]}
    assert _select_signing_key(jwks, "missing-kid") is None
