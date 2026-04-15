#!/usr/bin/env python3
# pyright: reportMissingTypeStubs=false
# pyright: reportUnknownMemberType=false
# pyright: reportUnknownVariableType=false
# pyright: reportUnknownArgumentType=false
"""Seed realistic demo data for tomorrow's investor pitch.

Usage:
    cd backend && uv run python scripts/seed_demo.py
    cd backend && uv run python scripts/seed_demo.py --clerk-user-id user_ABC
    cd backend && uv run python scripts/seed_demo.py --clean

Idempotent: re-running overwrites the demo sessions/messages/scores for the
target founder. `--clean` wipes everything first.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import asyncpg

DEFAULT_CLERK_USER_ID = "user_3CGtuXSEFI1ViGZWPEN9TLWV6OK"
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
)

DEMO_SESSION_TYPES = ("big_picture", "problem_market", "business")


GITHUB_DATA_SAMPLE: dict[str, Any] = {
    "login": "torvalds",
    "name": "Linus Torvalds",
    "public_repos": 8,
    "followers": 215000,
    "following": 0,
    "bio": "Creator of Linux and Git.",
    "company": None,
    "location": "Portland, OR",
    "html_url": "https://github.com/torvalds",
    "avatar_url": "https://avatars.githubusercontent.com/u/1024025?v=4",
    "created_at": "2011-09-03T15:26:22Z",
    "top_repos": [
        {
            "name": "linux",
            "stars": 180000,
            "language": "C",
            "description": "Linux kernel source tree",
        },
        {
            "name": "subsurface-for-dirk",
            "stars": 2500,
            "language": "C",
            "description": "Dive log software",
        },
        {
            "name": "test-tlb",
            "stars": 400,
            "language": "C",
            "description": "TLB behaviour tests",
        },
    ],
    "languages": {"C": 92.1, "Shell": 4.3, "Makefile": 3.6},
    "fetched_at": "2026-04-11T22:00:00Z",
}


BIG_PICTURE_TRANSCRIPT: list[tuple[str, str]] = [
    (
        "user",
        "I'm Ada. Ten years as a software engineer, led infra at a Series B fintech for three of "
        "them, shipped Linux kernel patches before that. I'm prepping to raise a $3M seed for Entity.",
    ),
    (
        "assistant",
        "Ten years is useful shorthand but it tells me almost nothing on its own. Which of those "
        "years actually map to what you're building now — and what does a tier-1 seed partner "
        "learn from your background in 60 seconds that they wouldn't learn from anyone else in "
        "your pipeline? Be specific about the unfair advantage, not the resume.",
    ),
    (
        "user",
        "Fair. The kernel work taught me how to debug systems I didn't build; the fintech years "
        "taught me how to ship to paying customers under compliance pressure. Entity is a structured "
        "AI mentor plus signal-scoring layer for pre-seed founders — it runs the prep conversation "
        "a good angel would, then scores the founder on eight investor-facing dimensions.",
    ),
    (
        "assistant",
        "Okay, now we're somewhere. Two follow-ups. First: 'a good angel' is a moving target — "
        "whose voice is the mentor actually modeled on, and can you defend that choice with data "
        "or is it vibes? Second: what's the wedge that keeps this from being a thin wrapper on "
        "Claude? If I'm a skeptical GP I'm asking both of those in the first five minutes.",
    ),
    (
        "user",
        "The mentor is trained on 200 anonymized pitch-prep transcripts from YC and Techstars "
        "alumni, weighted toward partners who write the first checks — not influencers. The wedge "
        "is the scoring layer: founders see what investors will see, with evidence attached. "
        "That's the defensibility — every conversation produces structured, comparable signal.",
    ),
    (
        "assistant",
        "Good answer on the wedge; weaker on the training data. Two hundred transcripts is a "
        "story, not a moat — anyone with cash can pay a recruiter to generate that corpus in a "
        "month. Push harder: what's your sustainable data advantage once you're at 500 founders? "
        "And who exactly is ICP — I heard 'pre-seed' but pre-seed is not a segment.",
    ),
    (
        "user",
        "ICP is technical second-time founders raising $2–5M who've already been told 'no' once "
        "and want to understand why. The data advantage compounds: every session generates "
        "labeled outcome data — did they close the round, at what valuation, which signals "
        "correlated. In twelve months we own the only benchmark dataset of pre-seed investor "
        "feedback tied to outcomes. Also: seed close times have doubled since 2023, so prep "
        "matters more now than when YC was founded.",
    ),
    (
        "assistant",
        "That's the pitch. Now rehearse the uncomfortable version: how do you know technical "
        "second-time founders are the ICP and not first-time ones who actually need the help "
        "more? Your 'seed close times doubled' line is true but it's a tailwind, not a thesis — "
        "every AI-for-founders startup is using it this week. Next session we'll dig into the "
        "problem and market: come ready with three pieces of evidence, not intuitions, that your "
        "ICP buys.",
    ),
]


PROBLEM_MARKET_TRANSCRIPT: list[tuple[str, str]] = [
    (
        "user",
        "Problem: pre-seed founders get inconsistent investor feedback — one angel says 'too "
        "early,' the next says 'not enough traction,' a third says 'wrong market.' They can't "
        "triangulate. They burn three months and six meetings before they learn what actually "
        "matters.",
    ),
    (
        "assistant",
        "Solid wedge framing, but the real question is whether founders are willing to pay to "
        "close that loop or whether they just complain about it on Twitter. What's your evidence "
        "they'll pay? I want a number — how many founders in your waitlist, what did they say "
        "when you asked for $200, and how many actually wired money versus nodded politely?",
    ),
    (
        "user",
        "312 on the waitlist, 47 booked paid prep sessions at $199 in the last six weeks without "
        "a landing page — just a Typeform and a Stripe link. Conversion from free mentor chat to "
        "paid was 18%. TAM is bottoms-up: ~30k US pre-seed founders a year, average prep spend "
        "is $1,200 based on Lenny's survey data — so $36M just in the US, probably 3x globally.",
    ),
    (
        "assistant",
        "I buy the waitlist number as a signal; I don't buy the TAM yet. 'Average prep spend' "
        "lumps coaches, courses, and decks into one bucket — strip it to what founders pay "
        "specifically for investor-readiness work and the number shrinks. Also, a TAM under $100M "
        "kills you with multi-stage funds. What's your path to a $1B+ wedge — is it adjacent "
        "products, or is this a vertical AI play with expansion into investor workflows?",
    ),
    (
        "user",
        "Expansion is the investor side in Phase 2 — same signal, different buyer. Investors pay "
        "$40k+ annually for deal-flow platforms like Affinity and Harmonic. If we own the "
        "founder-to-investor translation layer, we sell the structured data upward. On "
        "competition: Beni AI is consumer-grade and chat-only, Stellar is prep-only and human-led. "
        "Nobody bridges mentor + scoring + marketplace.",
    ),
    (
        "assistant",
        "Phase 2 is the right answer but VCs will discount it 80% until you prove Phase 1 — don't "
        "lead with it. On the moat: be honest that experienced operators don't need you, they've "
        "got warm intros and pattern recognition. Your durable market is first-time and "
        "second-time-but-outside-the-network founders. That's the unfair slice — say it out loud "
        "in the deck instead of pretending you're for everyone. We've covered enough here; let's "
        "close this session and move to the business model.",
    ),
]


BUSINESS_TRANSCRIPT: list[tuple[str, str]] = [
    (
        "user",
        "Business model: I'm torn. Option A is $49/month SaaS for founders, Option B is a $499 "
        "flat fee per 'readiness sprint', Option C is freemium with scored-report paywall at $29 "
        "one-time. I've done no pricing research yet — gut says B because it matches the mental "
        "model of 'prep for a specific round' but the LTV is worse.",
    ),
    (
        "assistant",
        "You're pricing before you understand willingness-to-pay segmentation, which is the most "
        "expensive kind of guess. Three things. First: run a Van Westendorp price-sensitivity "
        "survey on your 312-person waitlist this week — you'll get a defensible range in 48 "
        "hours. Second: the LTV problem with Option B isn't a bug if the CAC is near-zero via "
        "content, but you haven't shown me CAC math yet. Third: freemium with a scored-report "
        "paywall at $29 is a traffic strategy, not a business — do not confuse the two.",
    ),
    (
        "user",
        "Okay, I'll ship the Van Westendorp by Friday. On CAC — I've been writing a weekly "
        "teardown of public pitch decks on LinkedIn; 8k followers in three months, organic. "
        "Probably naive to assume that scales linearly but it's cheap right now.",
    ),
    (
        "assistant",
        "That's a real signal — own it but stress-test it. What does week 12 of that content look "
        "like when LinkedIn's algorithm de-prioritizes long-form again? Before next session, pull "
        "three numbers: organic conversion rate from a LinkedIn view to waitlist signup, cost per "
        "paid trial if you boosted the same post, and the follower overlap with your ICP "
        "definition from last session. Those three numbers decide whether you lead with $49 SaaS "
        "or $499 sprint in the deck. We're not done with this session yet — come back with the "
        "numbers.",
    ),
]


TRANSCRIPTS: dict[str, list[tuple[str, str]]] = {
    "big_picture": BIG_PICTURE_TRANSCRIPT,
    "problem_market": PROBLEM_MARKET_TRANSCRIPT,
    "business": BUSINESS_TRANSCRIPT,
}


SESSION_CONFIG: dict[str, dict[str, Any]] = {
    "big_picture": {
        "label": "Big Picture",
        "coverage_score": 88,
        "suggest_complete": True,
        "completed_offset_days": 2,
    },
    "problem_market": {
        "label": "Problem & Market",
        "coverage_score": 79,
        "suggest_complete": True,
        "completed_offset_days": 1,
    },
    "business": {
        "label": "Business",
        "coverage_score": 42,
        "suggest_complete": False,
        "completed_offset_days": None,
    },
}


CATEGORY_SCORES = {
    "founder": 85,
    "market": 78,
    "problem": 81,
    "competition": 58,
    "product": 72,
    "traction": 45,
    "pricing": 55,
    "team": 70,
}


async def clean_demo_data(conn: asyncpg.Connection, founder_id: str) -> None:
    await conn.execute(
        """
        DELETE FROM mentor_sessions
        WHERE founder_id = $1 AND session_type = ANY($2::text[])
        """,
        founder_id,
        list(DEMO_SESSION_TYPES),
    )
    await conn.execute(
        """
        DELETE FROM signal_scores
        WHERE startup_profile_id IN (
            SELECT id FROM startup_profiles WHERE founder_id = $1
        )
        """,
        founder_id,
    )


async def upsert_founder(conn: asyncpg.Connection, clerk_user_id: str) -> tuple[str, bool]:
    row = await conn.fetchrow(
        "SELECT id FROM founders WHERE clerk_user_id = $1", clerk_user_id
    )
    created = row is None
    if row is None:
        row = await conn.fetchrow(
            """
            INSERT INTO founders (
                clerk_user_id, email, name, linkedin_url, github_username, website_url,
                github_data, what_would_make_10x, onboarding_completed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, now())
            RETURNING id
            """,
            clerk_user_id,
            "ada@entity.dev",
            "Ada Lovelace",
            "https://www.linkedin.com/in/adalovelace",
            "torvalds",
            "https://entity.dev",
            json.dumps(GITHUB_DATA_SAMPLE),
            "Close a $3M seed in the next 90 days with two tier-1 funds leading.",
        )
    else:
        await conn.execute(
            """
            UPDATE founders SET
                name = $2,
                linkedin_url = $3,
                github_username = $4,
                website_url = $5,
                github_data = $6::jsonb,
                what_would_make_10x = $7,
                onboarding_completed_at = COALESCE(onboarding_completed_at, now())
            WHERE id = $1
            """,
            row["id"],
            "Ada Lovelace",
            "https://www.linkedin.com/in/adalovelace",
            "torvalds",
            "https://entity.dev",
            json.dumps(GITHUB_DATA_SAMPLE),
            "Close a $3M seed in the next 90 days with two tier-1 funds leading.",
        )
    return str(row["id"]), created


async def upsert_startup_profile(conn: asyncpg.Connection, founder_id: str) -> str:
    existing = await conn.fetchrow(
        """
        SELECT id FROM startup_profiles
        WHERE founder_id = $1 AND deleted_at IS NULL
        LIMIT 1
        """,
        founder_id,
    )
    if existing is None:
        row = await conn.fetchrow(
            """
            INSERT INTO startup_profiles (
                founder_id, company_name, one_liner, stage, raise_amount
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            """,
            founder_id,
            "Entity",
            "AI mentor and signal scoring for pre-seed founders",
            "pre_seed",
            3_000_000,
        )
        return str(row["id"])
    await conn.execute(
        """
        UPDATE startup_profiles SET
            company_name = $2,
            one_liner = $3,
            stage = $4,
            raise_amount = $5
        WHERE id = $1
        """,
        existing["id"],
        "Entity",
        "AI mentor and signal scoring for pre-seed founders",
        "pre_seed",
        3_000_000,
    )
    return str(existing["id"])


async def create_session(
    conn: asyncpg.Connection,
    founder_id: str,
    startup_profile_id: str,
    session_type: str,
) -> tuple[str, int]:
    cfg = SESSION_CONFIG[session_type]
    now = datetime.now(timezone.utc)
    offset = cfg["completed_offset_days"]
    completed_at = (now - timedelta(days=offset)) if offset is not None else None
    started_at = (
        completed_at - timedelta(minutes=25) if completed_at else now - timedelta(hours=2)
    )
    row = await conn.fetchrow(
        """
        INSERT INTO mentor_sessions (
            founder_id, startup_profile_id, session_type,
            started_at, completed_at,
            coverage_score, suggest_complete, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        RETURNING id
        """,
        founder_id,
        startup_profile_id,
        session_type,
        started_at,
        completed_at,
        cfg["coverage_score"],
        cfg["suggest_complete"],
        json.dumps({"seeded": True, "source": "seed_demo"}),
    )
    session_id = row["id"]

    transcript = TRANSCRIPTS[session_type]
    base = started_at
    for idx, (role, content) in enumerate(transcript):
        created_at = base + timedelta(minutes=2 * idx + 1)
        await conn.execute(
            """
            INSERT INTO mentor_messages (session_id, role, content, created_at)
            VALUES ($1, $2, $3, $4)
            """,
            session_id,
            role,
            content,
            created_at,
        )
    return str(session_id), len(transcript)


async def insert_signal_score(conn: asyncpg.Connection, startup_profile_id: str) -> None:
    await conn.execute(
        """
        DELETE FROM signal_scores WHERE startup_profile_id = $1
        """,
        startup_profile_id,
    )
    await conn.execute(
        """
        INSERT INTO signal_scores (
            startup_profile_id, overall_score, category_scores, signal_details,
            scoring_version, triggered_by, computed_at
        ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, now())
        """,
        startup_profile_id,
        72,
        json.dumps(CATEGORY_SCORES),
        json.dumps({}),
        "demo-v1",
        "seed_demo",
    )


async def run(clerk_user_id: str, clean: bool) -> None:
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        async with conn.transaction():
            founder_id, created = await upsert_founder(conn, clerk_user_id)
            verb = "Created" if created else "Upserted"
            print(f"✓ {verb} founder: Ada Lovelace (id={founder_id}, clerk={clerk_user_id})")

            startup_profile_id = await upsert_startup_profile(conn, founder_id)
            print(f"✓ Upserted startup_profile: Entity (id={startup_profile_id})")

            if clean:
                await clean_demo_data(conn, founder_id)
                print("✓ Cleaned prior demo sessions + scores")
            else:
                # Always wipe prior demo sessions so we don't hit the unique-per-type index
                await conn.execute(
                    """
                    DELETE FROM mentor_sessions
                    WHERE founder_id = $1 AND session_type = ANY($2::text[])
                    """,
                    founder_id,
                    list(DEMO_SESSION_TYPES),
                )

            for session_type in DEMO_SESSION_TYPES:
                cfg = SESSION_CONFIG[session_type]
                _, msg_count = await create_session(
                    conn, founder_id, startup_profile_id, session_type
                )
                status = (
                    "completed"
                    if cfg["completed_offset_days"] is not None
                    else "in progress"
                )
                print(
                    f"✓ Created session: {cfg['label']} "
                    f"({status}, coverage={cfg['coverage_score']}, messages={msg_count})"
                )

            await insert_signal_score(conn, startup_profile_id)
            cat_summary = " / ".join(f"{k}={v}" for k, v in CATEGORY_SCORES.items())
            print(f"✓ Inserted signal_scores: overall=72 ({cat_summary})")
    finally:
        await conn.close()

    print(
        f"Demo seed complete. Sign in as {clerk_user_id} and visit /dashboard/sessions."
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed realistic demo data for the investor pitch.")
    parser.add_argument(
        "--clerk-user-id",
        default=DEFAULT_CLERK_USER_ID,
        help=f"Target Clerk user id (default: {DEFAULT_CLERK_USER_ID})",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Wipe demo sessions and signal_scores for the founder before seeding.",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    await run(args.clerk_user_id, args.clean)


if __name__ == "__main__":
    asyncio.run(main())
