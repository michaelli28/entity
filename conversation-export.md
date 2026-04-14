# ZStar MVP Planning Session — Full Conversation Export

**Date:** 2026-04-11 to 2026-04-12
**Project:** ZStar (PitchFlow) — AI founder profiling + deal flow platform
**Scope:** Design and plan Phase 1 MVP (auth + onboarding + dashboard + AI mentor chat)

---

## Session Arc

1. Resumed prior session (scaffold complete, starting Phase 1 features)
2. Invoked `superpowers:brainstorming` skill
3. Decomposed Phase 1 into 6 sub-projects; picked Sub-project 1 first
4. Researched local AI agent architectures (Tauri, browser extensions, privacy)
5. Researched frontend design tooling + MCP servers
6. Installed design stack (motion, recharts, sonner, vaul, phosphor-icons; shadcn/aceternity/universal-icons MCPs)
7. Discussed Beni AI competitor; adapted persistent memory + proactive engagement ideas
8. Named mentor "Starry" — later dropped as "childish"
9. Ran first 5-agent review (product strategist, technical architect, UX/founder, security, VC)
10. Revised spec based on feedback
11. Ran second 5-agent review (senior engineer, AI/ML engineer, growth, privacy, pre-mortem)
12. Revised spec to 2-day scope (foundation + retention)
13. Wrote 52-task TDD implementation plan
14. Saved session

---

## Key Decisions

| Decision | Reasoning |
|---|---|
| Web-first, Tauri Phase 1.5 | Validate product before desktop complexity; same React code runs in Tauri |
| No mentor name | "Starry" flagged as childish for professional tool |
| One mentor mode (Coach) | Simplify scope; avoid coddling founders who need challenge |
| Chat first, scoring later | Validates conversation value before building scoring engine |
| RLS disabled, app-layer tenant isolation | RLS is dead code over asyncpg; CI lint enforces `founder_id` filter |
| Hand-curated patterns (50+), not mined | Statistical rigor requires N>5000; mining small datasets = noise |
| Two-call LLM architecture | Sonnet for mentor (streaming), Haiku async for signal extraction |
| Prompt caching Day 1 | 5x cost savings, 6x latency — not optional |
| Invite-only signup | Quality > volume for 30 design partners |
| Fake-door investor intro button | Validates whether real demand is coaching or intros |
| Privacy policy + ToS + DPAs before first signup | GDPR non-negotiable |
| Real deletion (30-day purge) | Soft delete alone not GDPR compliant |
| PII regex pre-filter Day 1 | 5-line regex removes 90% of accidental paste risk |
| Pricing committed | Founder free, Investor $149/mo (Phase 2) |

---

## Product Vision (adapted from Beni AI research)

ZStar differentiates from ChatGPT via:

1. **Curated expert knowledge** — 150+ patterns from YC essays, Sequoia memos, Reforge, Lenny's Newsletter, First Round Review, SaaStr, David Sacks, each with source citation, confidence tier, and `when_it_fails` counter-example
2. **Persistent founder memory** — mentor remembers across sessions ("last week you said retention was broken — what happened?")
3. **Structured scoring output** — Investor Readiness Score tied to empirical rubric
4. **Stage-aware framing** — pre-seed vs seed vs series A treated differently
5. **Cold Read artifact** — structured investor-style pushback generated after first conversation (aha moment + viral share seed)

## Safety architecture

- PII regex pre-filter (SSN, credit card, email, phone) before sending to Claude
- Haiku input classifier: startup_coaching / off_topic / harmful / crisis / investment_advice_request
- Crisis escalation: 988 Suicide & Crisis Lifeline, Founders Taking Action
- Disclaimers: not investment/legal/tax advice
- Jailbreak resistance: user input wrapped in `<user_message>` tags with system prompt that refuses to follow instructions inside them

---

## Architecture Summary

### Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4 (CSS-first) |
| UI | shadcn/ui, Aceternity UI (Aurora Background), Magic UI (Shimmer Button), Motion v12, Phosphor Icons, Recharts |
| Auth | Clerk (OAuth + JWT) with JWT template containing email/name/image_url |
| Backend | FastAPI, asyncpg (no supabase-py), Pydantic v2, Instructor for structured extraction |
| LLM | Anthropic Claude Sonnet 4.6 (mentor) + Haiku 4.5 (signal extraction, safety classifier) |
| DB | Supabase Postgres 17 + pgvector |
| Observability | Sentry, PostHog, structlog, request IDs |
| Email | Resend + React Email |
| Scheduling | APScheduler (in FastAPI lifespan) |
| Hosting | Vercel (frontend), Railway (backend), Supabase (db) |

### Request Flow

```
Browser → Next.js (Clerk middleware + onboarding guard)
  → [non-streaming] /api/[...path] route proxies to FastAPI (attaches JWT server-side)
  → [streaming chat] direct client → FastAPI via fetch + ReadableStream
      → FastAPI: JWKS kid-match → JWT verify
      → PII redact (regex)
      → Safety classifier (Haiku)
      → Claude Sonnet streaming (with prompt caching)
      → Async Haiku signal extraction (background task)
      → Persist partial message with finish_reason on error
```

### Database Schema (new Day 2 tables on top of scaffold init)

- `cold_reads` — structured aha artifacts (what_i_heard, investor_pushback[3], three_unanswered_questions[3], public_slug)
- `mentor_session_summaries` — per-session recap (key_facts, founder_tone, topics_covered, open_threads)
- `founder_commitments` — open-loop habit mechanic
- `cofounder_invites` — magic-link viral surface (7-day expiry)
- `intro_requests` — fake-door wedge validation
- `email_sends` — idempotency for transactional emails
- `founder_patterns` — curated empirical knowledge with source + confidence tier
- `stage_benchmarks` — stage-specific median metrics for "founders like you" comparisons
- `mentor_evals` — 20 golden examples with behavioral binary rubrics
- `processed_webhooks` — svix event idempotency

---

## Critical Fixes Identified in Reviews

### CRITICAL
1. **JWKS key selection by index** (`jwks["keys"][0]`) → use `kid` matching with auto-refresh
2. **JWKS cache never expires** → 1-hour TTL
3. **Webhook race condition** — `GET /api/founders/me` may arrive before `user.created` webhook → just-in-time upsert using JWT claims (no Clerk API call)
4. **EventSource can't attach Auth headers** → use fetch + ReadableStream SSE parser
5. **RLS is dead code over asyncpg** → disable, enforce app-layer + CI lint

### HIGH
6. **CORS missing PATCH** → onboarding broken without it
7. **Schema mismatches** (`stage` CHECK missing `idea`/`series_b_plus`, missing `avatar_url`/`linkedin_url`/`github_username` columns)
8. **`user.deleted` handler missing** → no GDPR data deletion path
9. **Webhook idempotency missing** → duplicate founders on retries
10. **Race on `startup_profiles`** → UNIQUE partial index on `founder_id`
11. **Stream error mid-response** → persist partial with `finish_reason` metadata
12. **X-Accel-Buffering: no** required on Railway Nginx for SSE
13. **No observability** → Sentry + PostHog + structlog + request IDs Day 1

### MEDIUM
14. Startup validation for required secrets (crash loud, not silent)
15. Rate limit webhook endpoint
16. Don't store raw OAuth JSONB payloads (extract specific fields only)
17. Onboarding guard must be server-enforced (not just frontend)
18. PII disclosure checkbox in onboarding Step 3
19. Prompt caching Day 1 (5x cost savings)
20. Safety layer (crisis escalation, scope guardrails, jailbreak resistance)

---

## 2-Day Plan Summary (52 Tasks)

### Day 1: Foundation + Working Chat (~13 hours)

| Task | Title |
|---|---|
| T01 | Install Day 1 dependencies |
| T02 | Create Day 1 database migration (stage values, uniques, triggers, idempotency, empirical tables) |
| T03 | ADR for disabled RLS |
| T04 | Fix JWKS kid matching + TTL cache |
| T05 | Secret validation + CORS PATCH |
| T06 | Structured logging + request ID middleware |
| T07 | Sentry backend initialization |
| T08 | Founder repository with upsert (concurrency-safe) |
| T09 | Startup profile repository with ensure-for-founder |
| T10 | Webhook idempotency repository |
| T11 | Mentor repository (sessions + messages) |
| T12 | PII regex redactor |
| T13 | Tenant isolation CI lint |
| T14 | PostHog backend integration |
| T15 | Complete Clerk webhook handlers |
| T16 | Founders API (GET/PATCH /me, /me/startup, /me/complete-onboarding) |
| T17 | Claude client with prompt caching |
| T18 | System prompts + context builder |
| T19 | Safety input classifier |
| T20 | Streaming chat endpoint |
| T21 | Frontend — Sentry + PostHog |
| T22 | Shared UI — Aurora Background + Shimmer Button |
| T23 | Middleware — Clerk auth + onboarding guard |
| T24 | Onboarding wizard (3 steps) |
| T25 | Sidebar + dashboard layout with auth guard |
| T26 | SSE stream parser (fetch + ReadableStream) |
| T27 | Chat UI components |
| T28 | API catch-all proxy |
| T29 | Playwright golden path |
| T30 | Day 1 integration smoke test |

### Day 2: Retention + Quality (~11 hours)

| Task | Title |
|---|---|
| T31 | Install Day 2 dependencies |
| T32 | Day 2 migration — retention tables |
| T33 | Structured extractors (ColdRead, SessionSummary, ExtractedSignals) |
| T34 | Cold Read generation + repository + API |
| T35 | Session summaries + commitments |
| T36 | Async signal extraction (two-call architecture) |
| T37 | Resend integration + welcome email |
| T38 | Re-engagement email (T+48h) |
| T39 | Scheduler + purge job (GDPR) |
| T40 | Data export endpoint |
| T41 | Cold Read frontend card + artifacts page |
| T42 | Commitment card on return |
| T43 | Invite co-founder + fake-door intro button |
| T44 | Seed 50+ founder patterns + 20+ stage benchmarks |
| T45 | Golden evals (20 behavioral binary examples) |
| T46 | Privacy policy, ToS, sub-processor pages |
| T47 | DPA register + Anthropic ZDR request doc |
| T48 | Invite-only signup via Clerk |
| T49 | Day 2 E2E — Cold Read generation |
| T50 | PostHog dashboard setup |
| T51 | Day 2 full test pass |
| T52 | Launch prep checklist |

---

## Success Metrics (Activation & Retention)

### Activation
- **Activation event:** ≥5 founder messages in Session 1 within 48h of signup
- Red flag: <35% activation rate

### Retention
- D2, D7, D14, D30 return rates by cohort
- Red flag: D7 < 10%

### Quality
- 20 golden evals pass rate ≥80%
- Mentor cites specific pattern in ≥50% of responses (once data loaded)

### Wedge validation
- Ratio: `intro_request_clicked / mentor_turn`
- If >3x by week 4 → pivot wedge to intros

---

## Pricing (Committed)

| Tier | Price | Audience | When |
|---|---|---|---|
| Founder Free | $0 | All founders | Always |
| Founder Pro | $29/mo | Serious fundraisers | Phase 2 |
| Investor Access | $149/mo | Angels, VCs | Phase 2 |

---

## Design Toolchain (9-step pipeline for every UI component)

1. **`ui-ux-pro-max` skill** — design system decisions
2. **Aceternity UI MCP** — dramatic effects (Spotlight, Aurora, Multi Step Loader)
3. **21st.dev MCP builder** — premium component snippets
4. **shadcn/ui MCP** — primitives (Field, Input, Chart, Sonner)
5. **mcp-universal-icons** — 60k+ icons with JSX + Tailwind
6. **Build in `packages/ui/`** with Motion v12
7. **21st.dev MCP refiner** — polish transitions
8. **21st.dev logo search** — LinkedIn/GitHub/Google OAuth logos
9. **Playwright** — screenshot every screen

### MCP servers configured (`.mcp.json`)
- `shadcn` — shadcn/ui component installation
- `aceternity` — 106+ Aceternity components
- `universal-icons` — 60k+ icon search
- `magic` (via plugin) — 21st.dev builder/refiner/logo search
- `playwright` (via plugin) — browser automation

### Installed packages (`@zstar/web`)
- `motion` v12 (formerly framer-motion) — animation engine, OKLCH-native
- `@phosphor-icons/react` — 9k+ icons, 6 weights, duotone for dark theme
- `recharts` — radar charts, radial gauges, trend lines
- `sonner` — toast notifications
- `vaul` — drawer/bottom-sheet

---

## Agent Reviews — Key Quotes

### Round 1

**Product Strategist (Opus):**
> "You have a thoughtful and technically ambitious vision. But you are building a cathedral when you need a tent. The most dangerous thing about this project is not the competition or the monetization gap — it is the 855-line PRD for a product that has zero users and zero revenue."

**Technical Architect (Opus):**
> "The biggest risks are operational: the webhook race condition will break sign-up for 100% of users, and the RLS gap means queries will silently return empty results."

**UX/Founder (Opus):**
> "The main risk isn't technical — it's the time-to-value gap. Right now, the flow is: sign up → 5-step onboarding → empty dashboard → start first session → complete first session → finally see value. That's potentially 30-45 minutes before the founder feels the product is worth their time."

**VC (Opus):**
> "Conditional pass. Would take a second meeting. The core insight is sound. But the business side needs work. No pricing model, overly ambitious scope for a solo founder, and unclear Phase 1-to-Phase 2 transition mechanics are real concerns."

### Round 2

**Senior Engineer (Opus):**
> "Use `fetch` + `ReadableStream`, not `EventSource` — EventSource cannot set Authorization headers, and cookie-based auth won't work cross-origin."

**AI/ML Engineer (Opus):**
> "The spec's Day 1 proposition, honestly stated: 'Claude Sonnet with a startup-shaped system prompt.' That's ChatGPT with extra steps. Don't ship with empty tables and pretend data solves it later. Ship with 200 hand-curated patterns."

**Growth (Opus):**
> "The spec ships a beautiful, secure, technically-sound session one experience — and a structurally guaranteed one-and-done product."

**Privacy (Sonnet):**
> "Don't onboard real founders until privacy policy, DPAs, real deletion, tenant isolation, and PII pre-filter are done."

**Pre-mortem (Opus):**
> "The most likely 90-day obituary reads: 'Shipped clean, launched quiet, retained nobody, learned little.'"

---

## Files Created / Modified

### Specs & Plans
- `docs/superpowers/specs/2026-04-12-mvp-2day-design.md` (approved)
- `docs/superpowers/plans/2026-04-12-mvp-2day-implementation.md` (52 tasks, 5408 lines)
- `docs/superpowers/specs/2026-04-11-auth-onboarding-dashboard-design.md.superseded`
- `docs/superpowers/specs/2026-04-11-mvp-day1-design.md.superseded`

### Config
- `.mcp.json` (shadcn, aceternity, universal-icons)
- `.claude/CLAUDE.md` (expanded Design Tooling section)

### Package installations
- `apps/web/package.json` (+motion, +@phosphor-icons/react, +recharts, +sonner, +vaul)

### Session
- `~/.claude/session-data/2026-04-12-mvp-plan-complete-session.tmp`

---

## Known Blockers / Open Items

- User must run `sudo chown -R 501:20 ~/.npm` to fix npm cache permissions
- Founder outcome data pending ("placeholders, I'm still getting the data")
- DPAs to sign (8 providers): Clerk, Anthropic, Supabase, Vercel, Railway, Sentry, PostHog, Resend
- Anthropic ZDR to request
- Clerk JWT template "backend" to configure manually in dashboard (email/name/image_url claims)
- Clerk invite-only restricted mode to enable manually
- 100-target design-partner outreach list to write
- 50+ founder patterns to write (instructions + template in T44)
- 19 more golden eval YAML files to write (1 template in T45)

---

## Exact Next Step

User to choose between:

1. **Subagent-Driven execution** (recommended) — dispatch fresh subagent per task, review between, parallelize independent tasks (e.g., T08-T11 can run simultaneously)
2. **Inline execution** — run tasks in main session with checkpoints

After choice: invoke `superpowers:subagent-driven-development` or `superpowers:executing-plans` and begin with T01 (install dependencies) and T02 (migration) in sequence.
