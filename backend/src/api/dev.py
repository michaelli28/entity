# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
"""Developer-only endpoints. Gated is now off by explicit user request."""
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..core.dependencies import verify_clerk_jwt
from ..db.connection import get_connection
from ..db.repositories import founder_repository as frepo
from ..db.repositories import mentor_repository as mrepo
from ..db.repositories import sessions_repository as srepo
from ..db.repositories import startup_profile_repository as sppo

router = APIRouter(prefix="/api/dev", tags=["dev"])


DEMO_FOUNDER = {
    "linkedin_url": "https://www.linkedin.com/in/demo-founder-entity",
    "github_username": "demo-founder-entity",
    "website_url": "https://demoflow.example.com",
    "what_would_make_10x": (
        "A warm intro to 3 Series-A SaaS founders who went through PLG→sales "
        "motion and can pressure-test our pricing model."
    ),
}

DEMO_STARTUP = {
    "company_name": "DemoFlow",
    "one_liner": (
        "AI workflow copilot for ops teams at mid-market SaaS — we turn "
        "unstructured Slack/Jira chatter into traced, repeatable runbooks."
    ),
    "stage": "pre_seed",
    "category": "devtools",
}


# (role, content) pairs — 3 user↔assistant turns per session
DEMO_MESSAGES: dict[str, list[tuple[str, str]]] = {
    "big_picture": [
        (
            "user",
            "I'm Alex — I ran platform eng at two Series-B SaaS companies and "
            "watched ops teams burn out rebuilding the same runbooks every "
            "quarter. DemoFlow turns their Slack and Jira history into traced, "
            "repeatable automations.",
        ),
        (
            "assistant",
            "Good start — 'ops teams at mid-market SaaS' is still a segment, "
            "not a person. Who specifically is the buyer and who is the user?",
        ),
        (
            "user",
            "Buyer is the VP of Platform or Head of Ops (50-500 eng org). "
            "Primary user is the on-call SRE who triages incidents and writes "
            "postmortems. Both feel the pain weekly.",
        ),
        (
            "assistant",
            "Why now? What changed that makes this the right moment versus "
            "two years ago?",
        ),
        (
            "user",
            "LLMs good enough to read messy chat context reliably, and "
            "post-ZIRP ops budgets are flat — nobody is hiring a 4th SRE; "
            "they're buying leverage instead.",
        ),
        (
            "assistant",
            "Solid thesis. Tighten the 'timing' story with one concrete data "
            "point next time — e.g., a benchmark or a budget signal you've "
            "seen first-hand.",
        ),
    ],
    "problem_market": [
        (
            "user",
            "Pain: on-call engineers spend 6-10 hrs/week re-discovering "
            "tribal knowledge that lives in dead Slack threads. I've done 28 "
            "customer interviews; 24 ranked it top-3 pain.",
        ),
        (
            "assistant",
            "Bottoms-up TAM — walk me through it.",
        ),
        (
            "user",
            "~18k US SaaS companies with 50-500 engineers. Assume a "
            "$24k/yr seat bundle (3 seats per team, 2 teams per co) → "
            "~$2.6B serviceable. Beachhead is the 2.1k companies already "
            "using PagerDuty + Linear, ~$300M.",
        ),
        (
            "assistant",
            "Competitors? Be honest — 'none' is never the answer.",
        ),
        (
            "user",
            "Rootly and incident.io own the incident-response layer; Notion "
            "AI and Glean own search. We wedge between: we don't replace the "
            "incident tool, we ingest from it and emit runbook automations.",
        ),
        (
            "assistant",
            "Moat question: a big incumbent ships a 'runbook AI' feature "
            "next quarter. Why don't you die?",
        ),
        (
            "user",
            "Our training data is the customer's own chat history plus "
            "human-graded outcomes — compounds per customer. Incumbents "
            "can't backfill that without breaking their core positioning.",
        ),
    ],
    "business": [
        (
            "user",
            "Pricing is $1,500/team/month flat, unlimited runbooks, "
            "usage-metered LLM tokens passed through at cost. No per-seat "
            "creep because ops teams hate seat math.",
        ),
        (
            "assistant",
            "Real traction numbers — not narratives.",
        ),
        (
            "user",
            "4 paid design partners ($6k MRR), 11 on the waitlist. NRR not "
            "meaningful yet (too early). Avg time-to-first-value is 9 days.",
        ),
        (
            "assistant",
            "How do you get to 100 customers?",
        ),
        (
            "user",
            "Two motions: (1) founder-led sales into the PagerDuty user "
            "community — I already speak at their meetups; (2) a free "
            "Slack-only read-only mode that produces a shareable weekly "
            "'ops health' digest, viral loop inside the team.",
        ),
        (
            "assistant",
            "Team gaps — be honest.",
        ),
        (
            "user",
            "It's me (eng+product) and one senior MLE. Missing a "
            "founding AE and a design-partner CSM. Planning to hire both "
            "post-round.",
        ),
    ],
    "ask": [
        (
            "user",
            "Raising $1.8M on a $10M post SAFE. Round unlocks 18 months of "
            "runway to reach $40k MRR and 20 paying teams, the bar we've "
            "benchmarked for a seed round.",
        ),
        (
            "assistant",
            "Terms — anything non-standard?",
        ),
        (
            "user",
            "Standard YC SAFE, MFN, no discount, no side-letters. We'd "
            "consider a $250k lead allocation for a strategic.",
        ),
        (
            "assistant",
            "Pipeline status — where are the conversations?",
        ),
        (
            "user",
            "2 soft-circled ($300k), 5 in diligence, 9 first meetings "
            "scheduled. Targeting close in 6 weeks.",
        ),
        (
            "assistant",
            "What do you need beyond capital?",
        ),
        (
            "user",
            "Intros to 3 Series-A SaaS founders who ran PLG→sales and can "
            "stress-test pricing. Also a design partner in fintech — "
            "currently all our partners are devtools-flavoured.",
        ),
    ],
}


DEMO_CATEGORY_SCORES = {
    "founder": 72,
    "market": 68,
    "problem": 80,
    "competition": 64,
    "product": 58,
    "traction": 51,
    "pricing": 66,
    "team": 55,
}
DEMO_OVERALL = 64
DEMO_SIGNAL_DETAILS = {
    "summary": "Strong founder-market fit, early traction thin but honest.",
    "strengths": ["clear ICP", "bottoms-up TAM", "transparent team gaps"],
    "weaknesses": ["MRR < $10k", "only 4 design partners", "no AE hired"],
}


@router.post("/seed-demo")
async def seed_demo(
    claims: dict[str, Any] = Depends(verify_clerk_jwt),  # noqa: B008
) -> dict[str, Any]:
    """Idempotently populate the caller's account with demo data."""
    async with get_connection() as conn:
        founder = await frepo.find_by_clerk_id(conn, claims["sub"])
        if not founder:
            raise HTTPException(status_code=404, detail="founder not found")
        founder_id = founder["id"]

        await frepo.update_profile(
            conn,
            founder_id=founder_id,
            linkedin_url=DEMO_FOUNDER["linkedin_url"],
            github_username=DEMO_FOUNDER["github_username"],
            website_url=DEMO_FOUNDER["website_url"],
            what_would_make_10x=DEMO_FOUNDER["what_would_make_10x"],
        )
        await frepo.complete_onboarding(conn, founder_id)

        profile = await sppo.ensure_for_founder(conn, founder_id=founder_id)
        await sppo.update_for_founder(
            conn,
            founder_id=founder_id,
            company_name=DEMO_STARTUP["company_name"],
            one_liner=DEMO_STARTUP["one_liner"],
            stage=DEMO_STARTUP["stage"],
            category=DEMO_STARTUP["category"],
        )
        profile_id = profile["id"]

        # Reset + reseed mentor sessions and messages
        await srepo.delete_all_for_founder(conn, founder_id=founder_id)
        session_ids: dict[str, str] = {}
        for session_type, turns in DEMO_MESSAGES.items():
            session = await srepo.create_or_get_active(
                conn,
                founder_id=founder_id,
                startup_profile_id=profile_id,
                session_type=session_type,
            )
            for role, content in turns:
                await mrepo.insert_message(
                    conn, session["id"], role=role, content=content
                )
            session_ids[session_type] = str(session["id"])

        # Fresh signal score row
        await conn.execute(
            "DELETE FROM signal_scores "
            "WHERE startup_profile_id = $1",
            profile_id,
        )
        await conn.execute(
            """
            INSERT INTO signal_scores
                (startup_profile_id, overall_score, category_scores,
                 signal_details, scoring_version, triggered_by)
            VALUES ($1, $2, $3::jsonb, $4::jsonb, 'demo-v1', 'seed_demo')
            """,
            profile_id,
            DEMO_OVERALL,
            json.dumps(DEMO_CATEGORY_SCORES),
            json.dumps(DEMO_SIGNAL_DETAILS),
        )

    return {
        "ok": True,
        "founder_id": str(founder_id),
        "sessions": session_ids,
        "overall_score": DEMO_OVERALL,
    }
