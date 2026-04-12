# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
from typing import Any

from posthog import Posthog

from ..core.config import settings

_client: Posthog | None = None


def _get_client() -> Posthog | None:
    global _client
    if _client is None and settings.posthog_api_key:
        _client = Posthog(
            project_api_key=settings.posthog_api_key,
            host="https://us.i.posthog.com",
        )
    return _client


def capture(
    distinct_id: str, event: str, properties: dict[str, Any] | None = None
) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        client.capture(
            distinct_id=distinct_id,
            event=event,
            properties=properties or {},
        )
    except Exception:
        pass  # telemetry must never break the request
