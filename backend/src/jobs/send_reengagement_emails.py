# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
"""Run hourly. For each founder who signed up 40-72 hours ago, hasn't
returned since their first session, and has open commitments, send a
re-engagement email referencing unanswered investor objections.
"""
import structlog

from ..db.connection import get_connection
from ..integrations import resend_client

log = structlog.get_logger()

_BODY_STYLE = (
    "background:#0b0b10;color:#eee;font-family:sans-serif;padding:24px;"
)


def _render_html(
    founder_name: str, commitments: list[str], unanswered: list[str]
) -> str:
    commits = "".join(f"<li>{c}</li>" for c in commitments) or (
        "<li>Pick up where you left off</li>"
    )
    qs = "".join(f"<li>{q}</li>" for q in unanswered)
    return (
        f'<html><body style="{_BODY_STYLE}">'
        f'<h1 style="color:#a78bfa;">You left {len(unanswered)} investor '
        f"objections unanswered, {founder_name}.</h1>"
        "<p>Your mentor saved them. Here's what's still open:</p>"
        f"<ul>{qs}</ul>"
        "<p>Your commitment from last session:</p>"
        f"<ul>{commits}</ul>"
        '<p><a href="https://zstar.ai/dashboard/chat" '
        'style="color:#a78bfa;">Continue the conversation →</a></p>'
        "</body></html>"
    )


async def run() -> int:
    """Return number of emails sent."""
    sent = 0
    async with get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT
                f.id as founder_id,
                f.email,
                f.name,
                cr.three_unanswered_questions
            FROM founders f
            LEFT JOIN cold_reads cr ON cr.founder_id = f.id
            WHERE f.created_at
                BETWEEN now() - INTERVAL '72 hours' AND now() - INTERVAL '40 hours'
              AND f.deleted_at IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM email_sends es
                WHERE es.founder_id = f.id
                  AND es.email_type = 'reengagement_48h'
              )
              AND NOT EXISTS (
                SELECT 1 FROM mentor_messages m
                JOIN mentor_sessions s ON s.id = m.session_id
                WHERE s.founder_id = f.id
                  AND m.created_at > f.created_at + INTERVAL '1 hour'
              )
            LIMIT 50
            """
        )
        for r in rows:
            unanswered = r["three_unanswered_questions"] or []
            if not unanswered:
                continue
            commitments = await conn.fetch(
                """
                SELECT description FROM founder_commitments
                WHERE founder_id = $1 AND completed_at IS NULL
                """,
                r["founder_id"],
            )
            html = _render_html(
                r["name"] or "there",
                [c["description"] for c in commitments],
                list(unanswered),
            )
            msg_id = resend_client.send(
                to=r["email"],
                subject=(
                    f"You left {len(unanswered)} investor objections unanswered"
                ),
                html=html,
            )
            if msg_id:
                await conn.execute(
                    """
                    INSERT INTO email_sends (founder_id, email_type)
                    VALUES ($1, 'reengagement_48h')
                    ON CONFLICT DO NOTHING
                    """,
                    r["founder_id"],
                )
                log.info(
                    "reengagement_sent", founder_id=str(r["founder_id"])
                )
                sent += 1
    return sent
