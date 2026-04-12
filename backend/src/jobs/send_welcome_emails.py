# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
"""Run periodically. For each founder who has a recent Cold Read but no
welcome email yet, send the welcome email containing the Cold Read."""
from typing import Any

import structlog

from ..db.connection import get_connection
from ..integrations import resend_client

log = structlog.get_logger()

_BODY_STYLE = (
    "background:#0b0b10;color:#eee;font-family:sans-serif;padding:24px;"
)


def _render_welcome_html(payload: dict[str, Any]) -> str:
    pushback_items = "".join(
        f"<li>{p}</li>" for p in payload["investor_pushback"]
    )
    question_items = "".join(
        f"<li>{q}</li>" for q in payload["three_unanswered_questions"]
    )
    return f"""
    <html><body style="{_BODY_STYLE}">
      <h1 style="color:#a78bfa;">Your Cold Read, {payload['founder_name']}</h1>
      <p>Here's what I heard from our conversation tonight.</p>
      <div style="background:#141420;padding:16px;border-radius:12px;">
        <p>{payload['what_i_heard']}</p>
      </div>
      <h2>What investors will push on</h2>
      <ul>{pushback_items}</ul>
      <h2>Three questions you can't yet answer</h2>
      <ul>{question_items}</ul>
    </body></html>
    """


async def run() -> int:
    """Return number of emails sent."""
    sent = 0
    async with get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT cr.*, f.email as founder_email, f.name as founder_name
            FROM cold_reads cr
            JOIN founders f ON f.id = cr.founder_id
            WHERE cr.created_at > now() - INTERVAL '1 hour'
              AND NOT EXISTS (
                SELECT 1 FROM email_sends es
                WHERE es.founder_id = cr.founder_id
                  AND es.email_type = 'welcome_cold_read'
              )
            LIMIT 50
            """
        )
        for r in rows:
            html = _render_welcome_html(dict(r))
            msg_id = resend_client.send(
                to=r["founder_email"],
                subject="Your Cold Read from tonight's session",
                html=html,
            )
            if msg_id:
                await conn.execute(
                    """
                    INSERT INTO email_sends (founder_id, email_type)
                    VALUES ($1, 'welcome_cold_read')
                    ON CONFLICT DO NOTHING
                    """,
                    r["founder_id"],
                )
                log.info(
                    "welcome_email_sent", founder_id=str(r["founder_id"])
                )
                sent += 1
    return sent
