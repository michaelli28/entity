# Day 1 MVP: Auth + Onboarding + Dashboard Shell + Chat

**Date:** 2026-04-11 (revised from earlier same-day spec)
**Status:** Approved
**Replaces:** `2026-04-11-auth-onboarding-dashboard-design.md` (will be archived)
**Review:** Refined via 5-agent parallel review (product strategist, technical architect, UX/founder, security, VC)

## What Changed From the Original Spec

- **Dropped "Starry"** — AI mentor is unnamed, referenced as "your mentor" in UI
- **One mentor mode only** — Coach (direct, Socratic). Removed `mentor_mode` column entirely.
- **Chat first, scoring later** — validates conversation value before building scoring engine
- **Onboarding: 5 steps → 3 steps** — Welcome, About You + Startup (combined), Ready
- **Nav: 5 items → 2 items** — Chat + Settings (progressive disclosure)
- **Deferred:** `founder_memory`, `next_suggested_session`, `last_active_at`, Recharts install, mentor modes, OAuth enrichment, multi-session structure (only Session 1 Big Picture), Dashboard/Profile/Sessions pages, settings mentor mode selector
- **Added:** empirical data architecture (patterns, benchmarks, evals), just-in-time founder creation, all CRITICAL/HIGH security fixes
- **Land in chat after onboarding** — not empty dashboard
- **Visual restraint** — Aurora Background + Shimmer Button only (max 2 effects)

## Overview

In one day of focused work, ship the minimum viable founder experience: sign up → 3-step onboarding → first conversation with the AI mentor. Build the skeleton for empirical-data-driven mentor training (pattern library, stage benchmarks, evaluation harness) so loading real data later just populates tables — no architecture changes.

This is Sub-project 1 + the core of Sub-project 2 compressed into a single day's work.

## Day 1 Scope

| Feature                                                                                   | Effort | Priority |
| ----------------------------------------------------------------------------------------- | ------ | -------- |
| Auth webhook + just-in-time founder creation                                              | 1h     | CRITICAL |
| Repository layer (asyncpg with app-layer filtering)                                       | 45m    | CRITICAL |
| Security fixes (JWKS kid + TTL, CORS PATCH, user.deleted, idempotency, secret validation) | 1.5h   | CRITICAL |
| Schema migration (stage values, missing columns, removal of mentor_mode plan)             | 30m    | HIGH     |
| Empirical data tables (founder_patterns, stage_benchmarks, mentor_evals)                  | 30m    | HIGH     |
| 3-step onboarding wizard                                                                  | 2h     | HIGH     |
| Dashboard shell (2 nav items, auth guard)                                                 | 1.5h   | HIGH     |
| Chat UI with streaming Claude responses                                                   | 3h     | CRITICAL |
| System prompt + Big Picture session prompt                                                | 1h     | CRITICAL |
| Playwright verification of golden path                                                    | 1h     | HIGH     |

**Total: ~13 hours** — achievable in a focused day with parallel subagents.

---

## 1. Auth Webhook + Just-In-Time Founder Creation

### The race condition fix

**Problem:** Clerk redirects to `/dashboard` immediately after sign-up. The `user.created` webhook can arrive seconds or minutes later. Without a fix, `/api/founders/me` returns 404 and the dashboard breaks.

**Fix (just-in-time creation):** `GET /api/founders/me` creates the founder row on-the-fly if it doesn't exist, using Clerk's API to fetch profile data. The webhook becomes a backup reconciliation mechanism.

```python
# backend/src/api/founders.py
@router.get("/me")
async def get_me(claims: dict = Depends(verify_clerk_jwt)):
    clerk_user_id = claims["sub"]
    async with get_connection() as conn:
        founder = await founder_repo.find_by_clerk_id(conn, clerk_user_id)
        if founder is None:
            clerk_user = await fetch_clerk_user(clerk_user_id)
            founder = await founder_repo.create(
                conn,
                clerk_user_id=clerk_user_id,
                email=clerk_user["email"],
                name=clerk_user["name"],
                avatar_url=clerk_user.get("avatar_url"),
            )
            await startup_profile_repo.create(conn, founder_id=founder["id"])
        return founder
```

### Webhook idempotency

Every webhook handler uses `INSERT ... ON CONFLICT DO UPDATE` to handle Clerk retries:

```python
# backend/src/api/auth.py
async def handle_user_created(data):
    async with get_connection() as conn:
        await conn.execute(
            """
            INSERT INTO founders (clerk_user_id, email, name, avatar_url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (clerk_user_id) DO UPDATE
                SET email = EXCLUDED.email,
                    name = EXCLUDED.name,
                    avatar_url = EXCLUDED.avatar_url,
                    updated_at = now()
            """,
            clerk_user_id, email, name, avatar_url,
        )

async def handle_user_deleted(data):
    # Soft delete — preserve data for GDPR compliance window
    await conn.execute(
        "UPDATE founders SET deleted_at = now() WHERE clerk_user_id = $1",
        clerk_user_id,
    )
```

### Required files

- `backend/src/api/founders.py` — new, GET/PATCH endpoints
- `backend/src/api/auth.py` — complete user.created/user.updated/user.deleted handlers
- `backend/src/db/repositories/founder_repository.py` — new
- `backend/src/db/repositories/startup_profile_repository.py` — new
- `backend/src/integrations/clerk.py` — new, `fetch_clerk_user(user_id)` helper

### API endpoints

| Method | Path                                   | Purpose                                 |
| ------ | -------------------------------------- | --------------------------------------- |
| GET    | `/api/founders/me`                     | Current founder (just-in-time creation) |
| PATCH  | `/api/founders/me`                     | Update founder fields (name, bio)       |
| PATCH  | `/api/founders/me/startup`             | Update startup profile                  |
| POST   | `/api/founders/me/complete-onboarding` | Set `onboarding_completed_at`           |
| POST   | `/api/webhooks/clerk`                  | Webhook (existing stub, complete it)    |

### Application-layer authorization

Every repository query includes `WHERE founder_id = $1` derived from JWT. RLS policies are defense-in-depth only — they don't protect the asyncpg path. Document this in an ADR.

---

## 2. Security Fixes

All CRITICAL and HIGH findings from the security review:

### JWKS key selection (CRITICAL)

Replace `jwks["keys"][0]` with `kid` matching:

```python
# backend/src/core/dependencies.py
import jwt as pyjwt

async def verify_clerk_jwt(token: str = Depends(oauth2_scheme)) -> dict:
    unverified_header = pyjwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Missing key id")

    jwks = await _get_jwks()
    key_data = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
    if key_data is None:
        # Refresh once in case of key rotation
        jwks = await _get_jwks(force_refresh=True)
        key_data = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
        if key_data is None:
            raise HTTPException(status_code=401, detail="Invalid key id")

    signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
    # ... decode and return claims
```

### JWKS cache with TTL (CRITICAL)

```python
_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # 1 hour

async def _get_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache, _jwks_fetched_at
    if force_refresh or _jwks_cache is None or \
       (time.monotonic() - _jwks_fetched_at) > _JWKS_TTL:
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.clerk_jwks_url)
            response.raise_for_status()
            _jwks_cache = response.json()
            _jwks_fetched_at = time.monotonic()
    return _jwks_cache
```

### CORS PATCH method (HIGH)

```python
# backend/src/core/cors.py
allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
```

### Startup secret validation (MEDIUM)

```python
# backend/src/main.py lifespan
if not settings.database_url:
    raise RuntimeError("DATABASE_URL is required")
if not settings.clerk_webhook_secret:
    raise RuntimeError("CLERK_WEBHOOK_SECRET is required")
if not settings.anthropic_api_key:
    raise RuntimeError("ANTHROPIC_API_KEY is required")
```

### Rate limit webhook (MEDIUM)

```python
@router.post("/clerk")
@limiter.limit("100/minute")
async def clerk_webhook(request: Request, ...):
```

### Data minimization (MEDIUM)

Don't store raw OAuth payloads as JSONB. Extract only: `linkedin_url`, `github_username`, `avatar_url`. Discard the rest.

---

## 3. Database Migrations

### Migration: `fix_schema_gaps` (replaces the earlier memory/mentor_mode migration)

```sql
-- Add missing stage values
ALTER TABLE startup_profiles DROP CONSTRAINT IF EXISTS startup_profiles_stage_check;
ALTER TABLE startup_profiles ADD CONSTRAINT startup_profiles_stage_check
    CHECK (stage IN ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus'));

-- Add missing columns to founders
ALTER TABLE founders ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER founders_set_updated_at BEFORE UPDATE ON founders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER startup_profiles_set_updated_at BEFORE UPDATE ON startup_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### Migration: `create_empirical_data_tables`

These tables are the skeleton for the empirical-data-driven mentor. They start empty — real data loads later.

```sql
-- Empirical patterns extracted from founder outcome data
CREATE TABLE founder_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_key TEXT UNIQUE NOT NULL,        -- e.g., "tam_bottoms_up_improves_raise_rate"
    description TEXT NOT NULL,                -- human-readable pattern
    evidence JSONB,                            -- statistics, sample size, source
    applies_to_stages TEXT[] DEFAULT ARRAY['pre_seed','seed']::TEXT[],
    applies_to_categories TEXT[],              -- NULL = all categories
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stage-specific benchmarks for "founders like you" comparisons
CREATE TABLE stage_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage TEXT NOT NULL
        CHECK (stage IN ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus')),
    metric_key TEXT NOT NULL,                 -- e.g., "median_mrr", "team_size", "runway_months"
    metric_value JSONB NOT NULL,               -- {"median": 15000, "p25": 5000, "p75": 50000}
    category TEXT,                             -- NULL = all categories
    evidence_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(stage, metric_key, category)
);

-- Evaluation golden examples — measure mentor quality
CREATE TABLE mentor_evals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eval_name TEXT UNIQUE NOT NULL,
    founder_input TEXT NOT NULL,               -- what the founder said
    weak_response TEXT,                         -- example of bad mentor response
    ideal_response TEXT NOT NULL,               -- what the mentor should say
    eval_category TEXT,                         -- e.g., "tam_pushback", "pricing_probe"
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_founder_patterns_stages ON founder_patterns USING GIN(applies_to_stages);
CREATE INDEX idx_stage_benchmarks_stage ON stage_benchmarks(stage);
```

---

## 4. Onboarding Wizard (3 steps)

### Flow

| Step       | Route                 | Fields                                                   | Saves To                        |
| ---------- | --------------------- | -------------------------------------------------------- | ------------------------------- |
| 1. Welcome | `/onboarding`         | None — brief intro, "Let's go" CTA                       | Nothing                         |
| 2. Profile | `/onboarding/profile` | Name, role, company name, one-liner, stage               | `founders` + `startup_profiles` |
| 3. Ready   | `/onboarding/ready`   | Brief PII disclosure + "Start my first conversation" CTA | Sets `onboarding_completed_at`  |

**Completion target:** Under 90 seconds. Max 5 form fields total.

### PII disclosure in Step 3

A single line, not hidden:

> Your conversations are processed by Claude AI (Anthropic) and stored encrypted. Nothing is shared without your explicit action. [Read more](link)

Checkbox: "I understand" — required to proceed.

### Visual treatment

- **Background:** Aurora Background (Aceternity) — the hero effect
- **Primary CTA:** Shimmer Button (Magic UI)
- **Step transitions:** Motion `AnimatePresence` with simple fade+slide
- **No other effects** — no Spotlight on forms, no Number Ticker, no Border Beam

### After onboarding

Redirect directly to `/dashboard/chat` — the mentor sends the first message referencing what the founder entered:

> "Hey Alex — I see you're working on Acme, a B2B SaaS at the seed stage. Let's dig into your big picture. In one sentence: why are you building this?"

### Files

- `apps/web/src/app/(onboarding)/layout.tsx` — Aurora bg, no sidebar
- `apps/web/src/app/(onboarding)/page.tsx` — Step 1
- `apps/web/src/app/(onboarding)/profile/page.tsx` — Step 2 (combined)
- `apps/web/src/app/(onboarding)/ready/page.tsx` — Step 3

---

## 5. Dashboard Shell (2 nav items)

### Layout

Collapsible sidebar with:

- **ZStar logo** (top)
- **Chat** (ChatCircle duotone icon) — primary destination
- **Settings** (GearSix duotone icon) — placeholder page with sign-out, privacy info
- **User menu** (Clerk `<UserButton />`, bottom)

### Auth guard

In `(dashboard)/layout.tsx`:

1. Unauthenticated → redirect to `/sign-in`
2. Authenticated but no `onboarding_completed_at` → redirect to `/onboarding`
3. Otherwise → render dashboard

### Visual

- Sidebar bg: `oklch(0.16 0.01 260)` (card color)
- Active nav: primary color (no Border Beam — just solid color)
- Hover: subtle background shift (no Card Spotlight)
- Transition: Motion `layout` for smooth expand/collapse

### Files

- `apps/web/src/app/(dashboard)/layout.tsx` — sidebar shell + auth guard
- `apps/web/src/components/sidebar.tsx` — collapsible sidebar
- `apps/web/src/components/nav-item.tsx` — nav link
- `apps/web/src/app/(dashboard)/chat/page.tsx` — chat UI (see Section 6)
- `apps/web/src/app/(dashboard)/settings/page.tsx` — stub with sign-out

---

## 6. Chat UI with Streaming Claude Responses

### Scope: Session 1 (Big Picture) only

The mentor only runs one session type in Day 1: **Big Picture**. It's a conversational exploration of the founder's background, company, problem, and "why now." Sessions 2-4 come later.

### UI

- Full-height chat column centered in main content area
- Message bubbles: founder right-aligned, mentor left-aligned
- Mentor messages entrance: Blur Fade (Magic UI)
- Typing indicator: three pulsing dots in primary color
- Input at bottom: Textarea (shadcn) + Send button (Shimmer)
- Message list scrolls, auto-scroll-to-bottom on new message
- No avatar image — use the ZStar logo mark for mentor, Clerk avatar for founder

### Backend: streaming endpoint

```
POST /api/chat/stream
  Body: { session_id: UUID | null, message: string }
  Response: Server-Sent Events stream
    event: token — Claude streaming token
    event: done — final message with extracted context
    event: error — error details
```

**Direct client → FastAPI** (not through Next.js proxy) to avoid buffering. Requires CORS config to allow the web app origin, credentials, and `Authorization` header. `allow_methods` must include `POST`. Response uses `Content-Type: text/event-stream` and `Cache-Control: no-cache`.

### System prompt (v1)

```
You are an experienced startup mentor helping a founder prepare for fundraising.

Your role:
- Ask sharp, Socratic questions that force the founder to think clearly
- Push back when claims are vague, inflated, or unsupported
- Ground your feedback in empirical patterns when possible
- Do NOT coddle — investors won't
- Be concise: 2-4 sentences per response unless a longer explanation is genuinely needed

Session context: {{session_type}} — {{session_description}}

About this founder:
- Name: {{name}}
- Company: {{company_name}} ({{stage}})
- One-liner: {{one_liner}}

Relevant patterns from successful founders:
{{retrieved_patterns}}

Stage benchmarks:
{{retrieved_benchmarks}}

Recent conversation:
{{recent_messages}}

Respond naturally. Don't list these fields — use them to personalize.
```

Pattern/benchmark retrieval is SQL-based for Day 1 (simple category filter, no vector search yet). Vector search layers in later.

### Session persistence

- First message creates a `mentor_sessions` row with `session_type = 'big_picture'`
- Every message (user + assistant) saved to `mentor_messages`
- Session stays "active" until explicitly closed or inactive for 24h

### Files

- `backend/src/llm/client.py` — Anthropic SDK wrapper
- `backend/src/llm/prompts.py` — system prompt templates
- `backend/src/llm/context_builder.py` — assembles context (patterns, benchmarks, history)
- `backend/src/api/chat.py` — streaming endpoint
- `backend/src/db/repositories/mentor_repository.py` — sessions + messages
- `apps/web/src/app/(dashboard)/chat/page.tsx` — chat UI
- `apps/web/src/components/chat/` — MessageBubble, MessageList, ChatInput, TypingIndicator

### Empirical data hooks (placeholders)

```python
# backend/src/llm/context_builder.py
async def build_mentor_context(conn, founder_id, session_id):
    founder = await founder_repo.get(conn, founder_id)
    profile = await startup_profile_repo.get(conn, founder_id)

    # Retrieve relevant patterns (empty until you load data)
    patterns = await conn.fetch(
        """SELECT description FROM founder_patterns
           WHERE $1 = ANY(applies_to_stages)
           LIMIT 5""",
        profile["stage"],
    )

    # Retrieve stage benchmarks (empty until you load data)
    benchmarks = await conn.fetch(
        "SELECT metric_key, metric_value FROM stage_benchmarks WHERE stage = $1",
        profile["stage"],
    )

    recent_messages = await mentor_repo.recent_messages(conn, session_id, limit=20)

    return {
        "name": founder["name"],
        "company_name": profile["company_name"],
        "stage": profile["stage"],
        "one_liner": profile["one_liner"],
        "patterns": "\n".join(p["description"] for p in patterns) or "(none loaded)",
        "benchmarks": format_benchmarks(benchmarks) or "(none loaded)",
        "recent_messages": format_messages(recent_messages),
    }
```

When pattern/benchmark tables are empty (Day 1 reality), the mentor falls back gracefully to general-purpose coaching. As you populate the tables, responses get more data-grounded automatically — no code changes needed.

---

## 7. Evaluation Harness

### Directory

```
backend/evals/
├── run_evals.py          # runs evals against a mentor endpoint
├── golden/
│   ├── tam_pushback.yaml
│   ├── pricing_probe.yaml
│   └── vague_traction.yaml
└── README.md
```

### Format (each eval file)

```yaml
name: tam_pushback
category: tam
context:
  stage: seed
  company_name: Acme
  session_type: big_picture
founder_input: "Our TAM is $50 billion"
weak_response: "That's a great market size!"
ideal_response_traits:
  - mentions bottoms-up vs top-down
  - asks for specific wedge
  - challenges the $50B claim
  - references that investors will push back
```

### Runner

The runner sends each eval's `founder_input` to the mentor endpoint with the specified context, captures the response, and scores it against the `ideal_response_traits` using Claude as judge (structured output via Instructor).

Output: JSON report with pass/fail per eval, aggregate score. Run manually for now, add to CI later.

Day 1 ships with 3-5 golden examples seeded from common investor feedback patterns. You add more as you learn what the mentor gets wrong.

---

## 8. Playwright Verification (Golden Path)

Single E2E test that verifies the happy path:

```typescript
// apps/web/e2e/golden-path.spec.ts
test("golden path: sign up → onboarding → first message", async ({ page }) => {
  await page.goto("/sign-up");
  // Fill Clerk sign-up (via test mode)
  // ... submit

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: /let's go/i }).click();

  await page.fill('input[name="name"]', "Test Founder");
  await page.fill('input[name="companyName"]', "Acme");
  await page.fill('input[name="oneLiner"]', "B2B SaaS for accounting");
  await page.selectOption('select[name="stage"]', "seed");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/onboarding\/ready/);
  await page.getByRole("checkbox", { name: /understand/i }).check();
  await page.getByRole("button", { name: /start.*conversation/i }).click();

  await expect(page).toHaveURL(/\/dashboard\/chat/);
  await expect(page.getByText(/test founder/i)).toBeVisible({ timeout: 10000 });

  await page.fill("textarea", "We help accountants automate tax prep");
  await page.click('button[aria-label="Send"]');

  await expect(page.locator('[data-role="mentor-message"]')).toHaveCount(2, {
    timeout: 15000,
  });
});
```

Screenshots captured at each major step for visual review.

---

## 9. Out of Scope (Day 1)

- Signal extraction (Sub-project 3)
- Scoring engine (Sub-project 4)
- `founder_memory` table
- `last_active_at`, `next_suggested_session` columns
- `mentor_mode` column
- Multi-session structure (Sessions 2-4, deep dives)
- OAuth enrichment (LinkedIn/GitHub data pull)
- Dashboard overview, profile, sessions pages
- Shareable "Startup Snapshot" artifact
- ZStar Score (public embeddable badge)
- Recharts install
- Sonner, Vaul packages (installed but unused)
- Tauri desktop companion (Phase 1.5)
- PII redaction pipeline (Phase 1.5)
- Email/notification infrastructure
- Landing page (Sub-project 6)

All of the above remain on the roadmap but are deferred until Day 1 MVP is validated with real founders.

---

## 10. Success Criteria

- [ ] Golden path test passes: sign-up → 3-step onboarding → chat with streaming mentor response
- [ ] All CRITICAL/HIGH security findings from review are fixed
- [ ] Just-in-time founder creation works (no webhook race condition)
- [ ] Repository layer enforces `WHERE founder_id = $1` on every query
- [ ] Empirical data tables exist and are queried (empty = graceful fallback)
- [ ] 3-5 golden evals run against the mentor and produce a score report
- [ ] Completion rate assumption: 90-second onboarding, >60% reach first chat message
- [ ] Playwright screenshots show premium but restrained visual treatment

## 11. How the Mentor Becomes Effective (Training Strategy)

Day 1 builds the skeleton. Effectiveness comes from iterative data loading:

1. **Load patterns** into `founder_patterns` from your founder outcome data
2. **Load benchmarks** into `stage_benchmarks` from your dataset (median MRR by stage, etc.)
3. **Build RAG** in Sub-project 3: embed successful startup case studies, retrieve during conversations
4. **Calibrate scoring weights** in Sub-project 4: logistic regression on your dataset
5. **Grow the eval set** — every time the mentor gives weak feedback, add a golden example
6. **Run evals on every prompt change** — catch regressions before shipping

The architecture is designed so adding data improves the mentor without code changes. The chat code just queries `founder_patterns` and `stage_benchmarks` and injects what it finds. Empty tables → general coaching. Full tables → data-grounded coaching.

## 12. Pricing (Commit Now, Charge Later)

Based on VC review feedback — define pricing now even though we don't charge yet:

| Tier            | Price   | Audience            | Features                                                                         |
| --------------- | ------- | ------------------- | -------------------------------------------------------------------------------- |
| Founder Free    | $0      | All founders        | AI mentor, all sessions, score, private profile                                  |
| Founder Pro     | $29/mo  | Serious fundraisers | Priority investor visibility (Phase 2), monthly score refresh, pitch deck review |
| Investor Access | $149/mo | Angels, VCs         | Search scored founders, thesis filter, direct contact (Phase 2)                  |

Revenue line: Investor subscriptions. Phase 1 is free for founders forever.
