# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportAssignmentType=false
import contextlib
from typing import Any

import resend

from ..core.config import settings

_initialized = False


def _ensure_initialized() -> None:
    global _initialized
    if _initialized:
        return
    if settings.resend_api_key:
        resend.api_key = settings.resend_api_key
    _initialized = True


def send(
    *,
    to: str,
    subject: str,
    html: str,
    from_addr: str = "Entity Mentor <mentor@entity.ai>",
) -> str | None:
    _ensure_initialized()
    if not settings.resend_api_key:
        return None
    with contextlib.suppress(Exception):
        r: dict[str, Any] = resend.Emails.send(
            {
                "from": from_addr,
                "to": to,
                "subject": subject,
                "html": html,
            }
        )
        return r.get("id")
    return None
