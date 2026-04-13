# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
# pyright: reportAttributeAccessIssue=false
import asyncio
import contextlib
import json
from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID

import structlog
from anthropic import APIConnectionError, APIStatusError
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..core.config import settings
from ..core.dependencies import verify_clerk_jwt
from ..core.rate_limit import limiter
from ..db.connection import get_connection
from ..db.repositories import cold_read_repository as crepo
from ..db.repositories import founder_repository as frepo
from ..db.repositories import mentor_repository as mrepo
from ..db.repositories import sessions_repository as sessrepo
from ..db.repositories import startup_profile_repository as srepo
from ..integrations import posthog as ph
from ..llm import prompts
from ..llm.client import SONNET_MODEL, get_client
from ..llm.context_builder import build_messages_and_system
from ..llm.extractors import extract_signals, generate_cold_read
from ..llm.judges import judge_session_coverage
from ..llm.mentor_sessions import (
    BY_KEY,
    SessionBlueprint,
    SessionKey,
    make_deep_dive_blueprint,
)
from ..llm.redact import redact
from ..llm.safety import CANNED_RESPONSES, classify_intent
from ..rag.chat_grounding import build_chat_grounding
from ..rag.citations import validate_citations

log = structlog.get_logger()
router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: UUID
    message: str


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _judge_and_update_bg(
    session_id: UUID,
    founder_id: Any,
    blueprint: SessionBlueprint,
) -> None:
    """Run Haiku coverage judge and update session coverage monotonically."""
    try:
        async with get_connection() as conn:
            transcript = await mrepo.recent_messages(conn, session_id, limit=20)
            user_turns = await mrepo.user_turn_count(conn, session_id)
        result = await judge_session_coverage(blueprint, transcript, user_turns)
        async with get_connection() as conn:
            await sessrepo.update_coverage(
                conn,
                session_id=session_id,
                founder_id=founder_id,
                new_score=result.coverage_score,
                threshold=settings.COVERAGE_COMPLETION_THRESHOLD,
                user_turn_count=user_turns,
                min_turns=settings.COVERAGE_MIN_TURNS,
            )
    except Exception:
        log.exception("judge_bg_failed")


async def _maybe_generate_cold_read(
    founder_id: Any,
    session_id: Any,
    founder_context: str,
    clerk_sub: str,
) -> None:
    async with get_connection() as conn:
        turns = await mrepo.turn_count(conn, session_id)
        existing = await conn.fetchval(
            "SELECT id FROM cold_reads WHERE session_id = $1", session_id
        )
        if existing or turns < 3:
            return
        messages_rows = await mrepo.recent_messages(conn, session_id, limit=20)
    excerpt = "\n".join(f"{m['role']}: {m['content']}" for m in messages_rows)
    cold_read = await generate_cold_read(excerpt, founder_context)
    async with get_connection() as conn:
        await crepo.create(
            conn,
            founder_id=founder_id,
            session_id=session_id,
            what_i_heard=cold_read.what_i_heard,
            investor_pushback=cold_read.investor_pushback,
            three_unanswered_questions=cold_read.three_unanswered_questions,
        )
    ph.capture(clerk_sub, "cold_read_generated")


async def _extract_signals_bg(session_id: Any, user_message: str) -> None:
    try:
        signals = await extract_signals(user_message)
        async with get_connection() as conn:
            for s in signals.signals:
                await conn.execute(
                    """
                    INSERT INTO session_signals
                        (session_id, signal_key, signal_value, confidence)
                    VALUES ($1, $2, $3::jsonb, $4)
                    """,
                    session_id,
                    s.key,
                    json.dumps({"value": s.value}),
                    s.confidence,
                )
    except Exception:
        log.exception("signal_extraction_failed")


@router.post("/stream")
@limiter.limit("20/minute")
async def chat_stream(
    request: Request,
    body: ChatRequest,
    bg: BackgroundTasks,
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> StreamingResponse:
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    redacted, pii_count = redact(body.message)

    # Up-front session validation before opening the stream so the client
    # sees 404/409 as HTTP status, not mid-stream errors.
    async with get_connection() as conn:
        founder_pre = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder_pre:
            raise HTTPException(
                status_code=404, detail="founder not found; complete onboarding"
            )
        session_pre = await sessrepo.get_by_id_scoped(
            conn, session_id=body.session_id, founder_id=founder_pre["id"]
        )
    if session_pre is None:
        raise HTTPException(status_code=404, detail="session not found")
    if session_pre["completed_at"] is not None:
        raise HTTPException(
            status_code=409, detail="session is complete; start a new one"
        )

    # Blueprint lookup
    session_type_val = session_pre["session_type"]
    if session_type_val == SessionKey.DEEP_DIVE.value:
        blueprint = make_deep_dive_blueprint(
            session_pre["target_category"], session_pre["target_signal"]
        )
    else:
        blueprint = BY_KEY[SessionKey(session_type_val)]

    session_id: UUID = session_pre["id"]
    founder_id: Any = founder_pre["id"]

    async def event_stream() -> AsyncIterator[str]:
        full_text: list[str] = []
        finish_reason = "error"
        founder: dict[str, Any] = founder_pre
        profile: dict[str, Any] = {}
        input_tokens = 0
        output_tokens = 0
        try:
            async with get_connection() as conn:
                profile = await srepo.get_by_founder(conn, founder_id) or {}

            intent = await classify_intent(redacted)
            if intent in CANNED_RESPONSES:
                canned = CANNED_RESPONSES[intent]
                async with get_connection() as conn:
                    await mrepo.insert_message(
                        conn,
                        session_id,
                        role="user",
                        content=redacted,
                        metadata={"pii_redacted": pii_count, "intent": intent.value},
                    )
                    await mrepo.insert_message(
                        conn,
                        session_id,
                        role="assistant",
                        content=canned,
                        metadata={"canned": True, "intent": intent.value},
                    )
                yield _sse("session", {"session_id": str(session_id)})
                for ch in canned:
                    yield _sse("token", {"text": ch})
                finish_reason = "canned"
                yield _sse("done", {"finish_reason": finish_reason})
                ph.capture(
                    claims["sub"], "mentor_turn_canned", {"intent": intent.value}
                )
                return

            async with get_connection() as conn, conn.transaction():
                await mrepo.insert_message(
                    conn,
                    session_id,
                    role="user",
                    content=redacted,
                    metadata={"pii_redacted": pii_count},
                )
            bg.add_task(_extract_signals_bg, session_id, redacted)
            async with get_connection() as conn:
                grounding = await build_chat_grounding(
                    query=redacted, conn=conn, k=4
                )
                system_blocks, messages = await build_messages_and_system(
                    conn,
                    founder=founder,
                    profile=profile,
                    blueprint=blueprint,
                    session_id=session_id,
                    new_user_message=redacted,
                    grounding=grounding,
                )

            yield _sse("session", {"session_id": str(session_id)})

            client = get_client()
            async with client.messages.stream(
                model=SONNET_MODEL,
                max_tokens=800,
                temperature=0.7,
                stop_sequences=["\n\nUser:"],
                system=system_blocks,  # type: ignore[arg-type]
                messages=messages,  # type: ignore[arg-type]
            ) as stream:
                async for text in stream.text_stream:
                    full_text.append(text)
                    yield _sse("token", {"text": text})
                final_msg = await stream.get_final_message()
                input_tokens = final_msg.usage.input_tokens
                output_tokens = final_msg.usage.output_tokens

            finish_reason = "stop"
            # Validate citations and emit any that survived before 'done'.
            if grounding.chunks:
                cleaned, valid_cites = validate_citations(
                    "".join(full_text), grounding
                )
                # Replace buffered text so persistence uses the cleaned form.
                full_text = [cleaned]
                if valid_cites:
                    yield _sse(
                        "citations",
                        {
                            "citations": [
                                {
                                    "index": c.index,
                                    "paper_id": str(c.paper_id),
                                    "paper_title": c.paper_title,
                                    "section": c.section,
                                    "snippet": c.snippet,
                                }
                                for c in valid_cites
                            ]
                        },
                    )
            yield _sse("done", {"finish_reason": finish_reason})

        except (APIStatusError, APIConnectionError):
            log.exception("claude_stream_failed")
            yield _sse(
                "error",
                {"message": "The mentor lost its train of thought. Please retry."},
            )
        except asyncio.CancelledError:
            finish_reason = "client_disconnect"
            raise
        finally:
            if full_text and session_id is not None:
                with contextlib.suppress(Exception):
                    async with get_connection() as conn:
                        await mrepo.insert_message(
                            conn,
                            session_id,
                            role="assistant",
                            content="".join(full_text),
                            metadata={
                                "finish_reason": finish_reason,
                                "partial": finish_reason != "stop",
                                "input_tokens": input_tokens,
                                "output_tokens": output_tokens,
                            },
                        )
            log.info(
                "claude_call",
                founder_id=str(founder_id) if founder_id else None,
                session_id=str(session_id) if session_id else None,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                model=SONNET_MODEL,
                finish_reason=finish_reason,
            )
            if founder_id is not None:
                ph.capture(
                    claims["sub"],
                    "mentor_turn",
                    {
                        "session_id": str(session_id) if session_id else None,
                        "input_tokens": input_tokens,
                        "output_tokens": output_tokens,
                    },
                )
            if finish_reason == "stop":
                bg.add_task(
                    _maybe_generate_cold_read,
                    founder_id,
                    session_id,
                    prompts.founder_profile_block(founder, profile),
                    claims["sub"],
                )
                bg.add_task(
                    _judge_and_update_bg,
                    session_id,
                    founder_id,
                    blueprint,
                )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
