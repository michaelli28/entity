from typing import Any

from anthropic import AsyncAnthropic

from ..core.config import settings

SONNET_MODEL = "claude-sonnet-4-6"
HAIKU_MODEL = "claude-haiku-4-5-20251001"

_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


def build_cached_system(blocks: list[tuple[str, bool]]) -> list[dict[str, Any]]:
    """Return Anthropic system array with cache_control on blocks flagged cacheable.

    blocks: list of (text, is_cacheable) pairs.
    """
    out: list[dict[str, Any]] = []
    for text, cacheable in blocks:
        block: dict[str, Any] = {"type": "text", "text": text}
        if cacheable:
            block["cache_control"] = {"type": "ephemeral"}
        out.append(block)
    return out
