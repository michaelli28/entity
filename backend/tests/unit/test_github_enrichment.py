from unittest.mock import AsyncMock, patch

import pytest

from src.enrichment.github import fetch_github_profile


@pytest.mark.asyncio
@patch("src.enrichment.github.httpx.AsyncClient")
async def test_fetch_returns_none_on_404(mock_client_cls):
    mock_client = AsyncMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_resp = AsyncMock()
    mock_resp.status_code = 404
    mock_client.get = AsyncMock(return_value=mock_resp)
    mock_client_cls.return_value = mock_client

    result = await fetch_github_profile("nonexistentuser")
    assert result is None


@pytest.mark.asyncio
async def test_fetch_returns_none_on_empty_username():
    assert await fetch_github_profile("") is None
    assert await fetch_github_profile("   ") is None
