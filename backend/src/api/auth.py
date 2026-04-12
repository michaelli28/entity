# pyright: reportUnknownVariableType=false
# pyright: reportUnknownMemberType=false
# pyright: reportUntypedFunctionDecorator=false
# pyright: reportUnknownArgumentType=false
from typing import Any

import structlog
from fastapi import APIRouter, HTTPException, Request, Response
from svix.webhooks import Webhook, WebhookVerificationError

from ..core.config import settings
from ..core.rate_limit import limiter
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo
from ..db.repositories import startup_profile_repository as srepo
from ..db.repositories import webhook_idempotency_repository as wrepo
from ..integrations import posthog as ph

log = structlog.get_logger()
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


async def _verify_webhook(request: Request) -> dict[str, Any]:
    body = await request.body()
    headers = dict(request.headers)
    try:
        wh = Webhook(settings.clerk_webhook_secret)
        # svix.verify returns the parsed payload as a dict
        payload = wh.verify(body, headers)
    except WebhookVerificationError as e:
        raise HTTPException(status_code=401, detail="Invalid webhook signature") from e
    return payload  # type: ignore[return-value]


def _email_from(data: dict[str, Any]) -> str:
    addrs = data.get("email_addresses") or []
    return addrs[0]["email_address"] if addrs else ""


def _name_from(data: dict[str, Any]) -> str:
    fn, ln = data.get("first_name") or "", data.get("last_name") or ""
    return (fn + " " + ln).strip() or _email_from(data).split("@")[0]


@router.post("/clerk")
@limiter.limit("100/minute")
async def clerk_webhook(request: Request) -> Response:
    event_id = request.headers.get("svix-id")
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing svix-id header")

    payload = await _verify_webhook(request)

    async with get_connection() as conn:
        is_new = await wrepo.claim_event_id(conn, event_id)
        if not is_new:
            log.info("webhook_replay_skipped", event_id=event_id)
            return Response(status_code=200)

        event_type = payload.get("type")
        data = payload.get("data", {})
        clerk_user_id = data.get("id")

        if not clerk_user_id:
            raise HTTPException(status_code=400, detail="Missing user id")

        if event_type in ("user.created", "user.updated"):
            async with conn.transaction():
                founder = await frepo.upsert_by_clerk_id(
                    conn,
                    clerk_user_id=clerk_user_id,
                    email=_email_from(data),
                    name=_name_from(data),
                    avatar_url=data.get("image_url"),
                )
                await srepo.ensure_for_founder(conn, founder_id=founder["id"])
            if event_type == "user.created":
                ph.capture(clerk_user_id, "signup")
        elif event_type == "user.deleted":
            await frepo.soft_delete(conn, clerk_user_id)
            ph.capture(clerk_user_id, "account_deleted")
        else:
            log.info("webhook_ignored", event_type=event_type)

    return Response(status_code=200)
