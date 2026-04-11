import json
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from svix.webhooks import Webhook, WebhookVerificationError

from src.core.config import settings

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/clerk")
async def handle_clerk_webhook(request: Request) -> dict[str, str]:
    body = await request.body()
    headers = dict(request.headers)

    try:
        wh = Webhook(settings.clerk_webhook_secret)
        payload: dict[str, Any] = json.loads(
            wh.verify(body, headers)
        )
    except WebhookVerificationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        ) from e

    event_type = payload.get("type", "")

    if event_type == "user.created":
        # TODO: sync user to founders table (implemented in auth feature)
        pass

    return {"status": "ok"}
