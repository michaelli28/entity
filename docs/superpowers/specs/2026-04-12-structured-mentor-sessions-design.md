# Structured Mentor Sessions — Design Spec

**Date:** 2026-04-12
**Author:** Design via brainstorming dialogue + 5-agent adversarial review
**Status:** Approved for implementation planning
**PRD reference:** §5.1 "AI Mentor Agent", §5.3 "Founder Dashboard"
**Supersedes:** The freeform-chat MVP at `/dashboard/chat`

---

## 1. Problem

The current `/dashboard/chat` is a generic conversational interface. Signal extraction, scoring, and Cold Read generation all work, but the experience feels like a chatbot — not a guided diagnostic. The PRD specifies a structured four-session arc ("Big Picture → Problem & Market → Business → Ask") plus targeted Deep Dives on the weakest signal category. That structure is the thesis of the product — the mentor *is* the product, and a mentor runs sessions, not a chatroom.

This spec defines how to convert the existing chat surface into a session-aware experience where:
- Four core sessions each have their own focus, prompts, target signals, and completion criteria
- A lightweight judge suggests completion when coverage is sufficient; the founder confirms
- After the four core sessions are done, a Deep Dive on the founder's weakest signal unlocks
- Every session survives reload, is shareable by URL, and integrates with the existing scoring + Cold Read pipelines unchanged

## 2. Goals & Non-Goals

### Goals
- Make the mentor feel structured and purposeful
- Preserve all existing pipelines (signal extraction, Cold Read, scoring) without code changes to them
- Ship Deep Dive mode in the same feature cycle
- URL-addressable sessions (fix the sessionId-on-reload regression as a byproduct)
- Additive-only migration — no data loss, no breaking changes to existing `/api/chat/stream` callers that continue supplying no `session_type`

### Non-Goals (explicit cuts)
- OAuth enrichment (LinkedIn / GitHub data pull) — PRD §5.5 deferred
- Pitch deck / document upload
- Messaging-app delivery (Slack, WhatsApp) — Phase 1.5
- Score radar / trend visualization — separate feature
- Rolling session summary population
- Engagement Quality Score (PRD §5.2)
- Changes to the scoring engine
- Per-section publish/private controls on the Cold Read
- **Playwright end-to-end test for this feature is deferred to the day after the demo** — wall-clock latency (multiple polls × Haiku) makes it flaky under CI; backend integration + frontend Vitest tests are in-scope today

## 3. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Completion semantics | Hybrid: LLM-suggested + user-confirmed | Proactive guidance without removing agency |
| Navigation | Soft-linear: all clickable, one "Recommended" highlight | No paternalistic locks |
| Deep Dive | Ship in this feature | Turns the mentor from intake into coach |
| URL shape | Route per session type | Reload-safe, shareable, aligns with App Router idioms |
| Architecture | Registry module (`SessionBlueprint` Pydantic model) | Single source of truth, serializes cleanly |
| Judge model | Haiku 4.5 | Classification task, not coaching |
| Judge client | **Instructor** (consistent with `extractors.py`) | Typed `CoverageResult`, retry on bad JSON, no manual parsing |
| Session-type enum | `StrEnum`, not `Literal` | Needs runtime iteration, Pydantic validation, dict keys |
| Session creation path | **Single canonical path: `POST /api/sessions` → redirect to chat route with session_id in URL**. `/api/chat/stream` refuses to auto-create (400 if `session_id` missing) | Eliminates two-path reconciliation and race conditions |
| Completed-session UX | Read-only transcript view; "Start new attempt" creates a new row | Explicit, auditable |

## 4. Architecture

A registry module `backend/src/llm/mentor_sessions.py` holds one `SessionBlueprint` Pydantic model per core session plus a runtime factory for Deep Dives. The chat endpoint consults the registry for the per-session system-prompt suffix, target signals, and completion-judge prompt.

A post-turn BackgroundTask runs a Haiku-based coverage judge via Instructor. Results are written monotonically (scores only go up, `suggest_complete` only flips to true). Minimum 3 user turns before the judge can suggest completion. Frontend polls `GET /api/sessions/{id}` post-stream with a short backoff; when `suggest_complete` flips, a banner appears.

Session creation is single-path: frontend calls `POST /api/sessions`, gets back the row (created or fetched-if-exists via partial unique index), then navigates to `/dashboard/chat/[sessionType]?session=<uuid>`. `/api/chat/stream` becomes idempotent on an existing session — it never creates.

## 5. Data Model

One additive migration: `supabase/migrations/20260412220000_structured_sessions.sql`.

```sql
-- Typed columns, not JSONB bag (target fields are queried for analytics + Deep Dive routing)
ALTER TABLE mentor_sessions
    ADD COLUMN coverage_score INT NOT NULL DEFAULT 0,
    ADD COLUMN suggest_complete BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN target_category TEXT,
    ADD COLUMN target_signal TEXT,
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Deep-dive fields are only meaningful for deep_dive sessions
ALTER TABLE mentor_sessions
    ADD CONSTRAINT mentor_sessions_deep_dive_target_chk CHECK (
        (session_type = 'deep_dive' AND target_category IS NOT NULL AND target_signal IS NOT NULL)
        OR (session_type <> 'deep_dive' AND target_category IS NULL AND target_signal IS NULL)
    );

-- Partial unique index: prevents a founder from having two active core sessions of the same type
-- Deep Dives are exempt (multiple deep dives on different categories are legal)
CREATE UNIQUE INDEX mentor_sessions_active_per_type
    ON mentor_sessions (founder_id, session_type)
    WHERE completed_at IS NULL AND session_type <> 'deep_dive';

CREATE INDEX idx_mentor_sessions_founder_type
    ON mentor_sessions (founder_id, session_type, started_at DESC);
```

Notes:
- `coverage_score` — 0-100 from the Haiku judge. Monotonically non-decreasing (see §8).
- `suggest_complete` — flips to true only, never back to false.
- `target_category`, `target_signal` — nullable for core sessions, required+enforced for deep dives via CHECK.
- `metadata` — retained for genuinely open-ended future flags; nothing load-bearing lives here today.
- **Backfill for existing MVP sessions:** after the ALTER, run a one-time job in the migration to invoke the judge on each existing non-empty `big_picture` session. Budget ~$0.10 in Haiku cost for expected ≤100 pre-migration sessions. If the migration is deployed fresh (empty table), the backfill is a no-op.

The `session_type` enum already allows `big_picture | problem_market | business | ask | deep_dive` (existing init migration). No enum changes needed.

## 6. Backend Registry

New file `backend/src/llm/mentor_sessions.py`:

```python
from enum import StrEnum
from pydantic import BaseModel, Field

class SessionKey(StrEnum):
    BIG_PICTURE = "big_picture"
    PROBLEM_MARKET = "problem_market"
    BUSINESS = "business"
    ASK = "ask"
    DEEP_DIVE = "deep_dive"

class SessionBlueprint(BaseModel):
    model_config = {"frozen": True}
    key: SessionKey
    title: str
    subtitle: str
    order: int                          # 1-4 for core, 99 for deep_dive
    system_suffix: str                  # appended to MENTOR_IDENTITY (NOT returned to frontend)
    target_signals: tuple[str, ...]     # signal keys this session extracts
    completion_prompt: str              # judge instructions (NOT returned to frontend)
    starter_questions: tuple[str, ...]  # quick-reply chips

# Known signal categories (allowlist for Deep Dive target validation)
KNOWN_SIGNAL_CATEGORIES: frozenset[str] = frozenset({
    "founder", "market", "problem", "competition",
    "product", "traction", "pricing", "team",
})
KNOWN_SIGNAL_KEYS: frozenset[str] = frozenset({
    "founder_background", "product_description", "icp", "market_timing",
    "pain_points", "tam", "competition_analysis", "moat",
    "pricing_model", "traction_metrics", "gtm_strategy", "team_composition",
    "round_size", "terms", "investor_pipeline", "help_needed",
    "mrr_or_revenue", "design_partners", "unit_economics",
    # ...full list authored during implementation
})
```

Four core blueprints are module-level constants: `BIG_PICTURE`, `PROBLEM_MARKET`, `BUSINESS`, `ASK`, matching PRD §5.1. The Deep Dive blueprint is constructed at runtime by `make_deep_dive_blueprint(target_category, target_signal)` — both arguments are validated against the allowlists above; `ValueError` on mismatch, never reaches an f-string as raw user input.

Module-level exports:
- `CORE_BLUEPRINTS: tuple[SessionBlueprint, ...]` — the 4 in order
- `BY_KEY: dict[SessionKey, SessionBlueprint]` — lookup
- `make_deep_dive_blueprint(target_category: str, target_signal: str) -> SessionBlueprint` — validates + constructs

### Prompt content per core session (authored during implementation)

- **Big Picture** — founder background, product description, ICP, timing thesis
- **Problem & Market** — pain points with evidence, TAM/SAM/SOM, competition, moat
- **Business** — pricing, traction (quantified), GTM, team composition
- **Ask** — round size, terms, pipeline status, non-capital help

Each `system_suffix` is 4-8 sentences.

## 7. Context Builder Change

`backend/src/llm/context_builder.py` — `build_messages_and_system` gains a `blueprint: SessionBlueprint` parameter:

```python
system_blocks = build_cached_system(
    [
        (identity, True),                       # cached (stable)
        (profile_block, True),                  # cached (stable per founder)
        (blueprint.system_suffix, False),       # per-session framing, not cached
        (retrieved, False),                     # not cached (stage-varying)
    ]
)
```

Prompt caching on identity + profile is preserved because the per-session suffix sits in a non-cached block.

## 8. Completion Judge

New file `backend/src/llm/judges.py` — uses **Instructor** (consistent with `extractors.py`):

```python
class CoverageResult(BaseModel):
    coverage_score: int = Field(ge=0, le=100)
    missing: list[str]
    rationale: str

async def judge_session_coverage(
    blueprint: SessionBlueprint,
    transcript: list[dict[str, Any]],  # asyncpg rows, matches recent_messages return
    user_turn_count: int,
) -> CoverageResult:
    """Haiku 4.5 + Instructor. Never raises to caller (see chat.py wrapper)."""
```

**Transcript safety:** transcript content is wrapped in a `<transcript>...</transcript>` XML block and passed *after* the judge instructions (Anthropic recommends instructions last, but here we want instructions clearly delimited *from* untrusted data). User-authored content is passed through `redact()` before reaching the judge, matching the chat-path hygiene.

**Threshold:** pulled from `core/config.py` — `settings.COVERAGE_COMPLETION_THRESHOLD` (default `75`).

**Minimum turn floor:** `suggest_complete` cannot flip true unless `user_turn_count >= settings.COVERAGE_MIN_TURNS` (default `3`). Prevents embarrassing early completion on short chats.

**Monotonicity at SQL level:**
```sql
UPDATE mentor_sessions
SET coverage_score = GREATEST(coverage_score, $1),
    suggest_complete = suggest_complete OR ($1 >= $2 AND $3 >= $4)
    -- $1 = new score, $2 = threshold, $3 = user turn count, $4 = min turns
WHERE id = $5 AND founder_id = $6;
```

This guarantees scores only rise and `suggest_complete` is a one-way latch. Concurrent judge runs are safe.

**Failure mode:** Instructor retries on bad JSON automatically. A terminal failure (rate-limit, network) is logged via `structlog.exception()` and emits a PostHog `judge_failed` event (mirrors existing `ph.capture` usage). Row stays at its last known state. Next turn's judge reruns.

## 9. API Surface

All endpoints sit behind `verify_clerk_jwt`. **Tenant isolation is enforced by explicit `founder_id` predicates in every query** (RLS is disabled per ADR in memory #713; sqlglot CI lint enforces the pattern). There is **no `app.current_founder_id` session variable** — earlier spec drafts were wrong on this.

All request bodies are validated by Pydantic models with `StrEnum` + `Literal` constraints. `target_category` and `target_signal` accept only values in `KNOWN_SIGNAL_CATEGORIES` / `KNOWN_SIGNAL_KEYS`; invalid inputs return 422, never reach the factory.

### Changed: `POST /api/chat/stream`
- `ChatRequest` body: adds `session_id: UUID | None`. **No longer creates sessions.** Returns 400 if `session_id` is missing (frontend must `POST /api/sessions` first).
- Reads the session row, looks up the blueprint (core → `BY_KEY[session.session_type]`; deep_dive → `make_deep_dive_blueprint(session.target_category, session.target_signal)`), passes to `build_messages_and_system`.
- Kicks off `judge_session_coverage` as a BackgroundTask after the stream closes (same lifecycle as signal extraction + Cold Read).

### New: `GET /api/sessions/blueprints`
Public metadata only. Response model `list[BlueprintPublicResponse]` with explicit fields — **never** `dataclasses.asdict()` on `SessionBlueprint` (would leak `system_suffix` + `completion_prompt`):

```python
class BlueprintPublicResponse(BaseModel):
    key: SessionKey
    title: str
    subtitle: str
    order: int
    starter_questions: tuple[str, ...]
```

Route-level `response_model=list[BlueprintPublicResponse]`. Auth-gated (TanStack Query long-cache is fine; 401 invalidates the cache and redirects to sign-in).

### New: `GET /api/sessions`
Returns the authenticated founder's sessions:
```json
[{"id": "...", "session_type": "big_picture", "started_at": "...",
  "completed_at": null, "coverage_score": 42, "suggest_complete": false,
  "target_category": null, "target_signal": null}]
```
Query: `WHERE founder_id = $1 ORDER BY started_at DESC`.

### New: `GET /api/sessions/{id}`
Single-session fetch for polling. Query: `WHERE id = $1 AND founder_id = $2`. Returns 404 on miss (intentional — does not leak cross-tenant existence; matches existing `cold_reads` pattern).

### New: `POST /api/sessions`
Create/get-or-create a session.

```python
class CreateSessionRequest(BaseModel):
    session_type: SessionKey
    target_category: str | None = None   # validated against KNOWN_SIGNAL_CATEGORIES
    target_signal: str | None = None     # validated against KNOWN_SIGNAL_KEYS

    @model_validator(mode="after")
    def validate_deep_dive_targets(self) -> "CreateSessionRequest":
        if self.session_type == SessionKey.DEEP_DIVE:
            if not self.target_category or not self.target_signal:
                raise ValueError("deep_dive requires target_category and target_signal")
            if self.target_category not in KNOWN_SIGNAL_CATEGORIES:
                raise ValueError(f"invalid target_category")
            if self.target_signal not in KNOWN_SIGNAL_KEYS:
                raise ValueError(f"invalid target_signal")
        else:
            if self.target_category or self.target_signal:
                raise ValueError("non-deep-dive sessions cannot carry targets")
        return self
```

Core-session INSERT uses the partial unique index via `ON CONFLICT DO NOTHING`:
```sql
INSERT INTO mentor_sessions
    (founder_id, startup_profile_id, session_type)
VALUES ($1, $2, $3)
ON CONFLICT (founder_id, session_type) WHERE completed_at IS NULL AND session_type <> 'deep_dive'
    DO NOTHING
RETURNING *;
-- If no row returned (conflict), follow up with SELECT * WHERE founder_id = $1 AND session_type = $3 AND completed_at IS NULL
```

Deep Dive sessions always insert a new row (no unique index applies).

### New: `POST /api/sessions/{id}/complete`
Sets `completed_at = now()` WHERE `id = $1 AND founder_id = $2 AND completed_at IS NULL`. Returns 409 `{"detail": "already complete"}` on zero rows updated if the row exists. Returns 404 if the row doesn't exist or is cross-tenant.

### New: `GET /api/sessions/deep-dive/recommendation`
Returns `{target_category: str, target_signal: str}` based on latest `signal_scores`. Frontend calls this *before* `POST /api/sessions` for Deep Dive. Fallback: if `signal_scores` is empty (founder never finished a core session), return `{"target_category": "problem", "target_signal": "pain_points"}` with a flag `is_default: true` so UI can surface "we're starting with Problem as a safe default — you can change this later."

### `ensure_session` behavior change
The existing `mrepo.ensure_session` is retired for new chat traffic. Any code path still calling it must specify `session_type` and validate it matches stored value on a session-ID lookup (rejects with 400 if mismatched). Spec doesn't require deleting the function — just making `chat.py` use the new `sessions_repository` functions.

## 10. Frontend

### Routes (Next.js App Router, React 19)

```
apps/web/src/app/(dashboard)/dashboard/
├── sessions/
│   └── page.tsx              NEW — Server Component, renders SessionGrid
├── chat/
│   ├── page.tsx              CHANGED — redirect("/dashboard/sessions") via Next.js redirect()
│   ├── [sessionType]/
│   │   └── page.tsx          NEW — Server Component with notFound() guard
│   └── deep-dive/
│       └── [sessionId]/
│           └── page.tsx      NEW — Server Component; if session.completed_at, redirect to /dashboard/sessions
```

`[sessionType]/page.tsx` must:
```typescript
import { notFound } from "next/navigation";

const VALID_TYPES = new Set(["big-picture", "problem-market", "business", "ask"]);

export default async function Page({ params }: { params: Promise<{ sessionType: string }> }) {
  const { sessionType } = await params;
  if (!VALID_TYPES.has(sessionType)) notFound();
  // ...
}

export function generateStaticParams() {
  return [...VALID_TYPES].map((s) => ({ sessionType: s }));
}
```

**Confirmed duplicate:** `apps/web/src/app/(dashboard)/chat/page.tsx` exists alongside `apps/web/src/app/(dashboard)/dashboard/chat/page.tsx`. Both routes must redirect to `/dashboard/sessions`. Preferred: delete the legacy `(dashboard)/chat/page.tsx` (no `dashboard/` prefix) since no UI links to it — verify with `grep -r '"/chat"' apps/web/src` before deleting.

### Components

```
apps/web/src/components/sessions/
├── session-card.tsx          "use client" (onClick handler)
├── session-grid.tsx          "use client" (TanStack Query)
├── session-progress-ring.tsx Server Component (pure render from prop)
├── completion-banner.tsx     "use client" (polling, localStorage)
└── starter-questions.tsx     "use client" (onClick to seed first message)
```

### Shared frontend contracts

New file `apps/web/src/lib/schemas/session.ts`:
```typescript
export const sessionSchema = z.object({
  id: z.string().uuid(),
  session_type: z.enum(["big_picture", "problem_market", "business", "ask", "deep_dive"]),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  coverage_score: z.number().int().min(0).max(100),
  suggest_complete: z.boolean(),
  target_category: z.string().nullable(),
  target_signal: z.string().nullable(),
});
export type Session = z.infer<typeof sessionSchema>;
```

Both `completion-banner` and `session-grid` parse fetch responses through `sessionSchema.parse()`. Parse failure in the polling handler is swallowed as a non-update, not thrown.

### `session-grid.tsx` logic
- Fetches `/api/sessions/blueprints` (long TanStack cache, keyed by `["blueprints"]`)
- Fetches `/api/sessions` (30s cache, keyed by `["sessions"]`)
- **Invalidates `["sessions"]` on `POST /api/sessions/{id}/complete` success** via `queryClient.invalidateQueries` in the mutation's `onSuccess`
- Sorts sessions into cards by `blueprint.order` (backend is source of truth; frontend never hard-codes sequence)
- Recommended-next = first incomplete core session by `order`; no hard locks
- Deep Dive card: if any core session incomplete, show "Complete your 4 core sessions to unlock"; if all 4 complete, fetches `GET /api/sessions/deep-dive/recommendation` and shows "Start Deep Dive on [target_category]" with a pre-start confirmation (respects `is_default: true` flag from the endpoint)
- Progress ring state machine:
  - `started_at === null` → "Not started" label, empty ring
  - `started_at !== null && coverage_score === 0 && user_turn_count < 3` → "Analyzing…" with pulsing ring
  - `coverage_score > 0` → numeric ring 0-100
  - `completed_at !== null` → checkmark badge

### `completion-banner.tsx` logic
- Polls `GET /api/sessions/{id}` using an `AbortController` inside `useEffect` with cleanup:
  ```typescript
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const delays = [2000, 3000, 5000, 8000];
      for (const delay of delays) {
        await new Promise((r) => setTimeout(r, delay));
        if (controller.signal.aborted) return;
        // fetch, parse via sessionSchema, break on coverage_score change
      }
    })();
    return () => controller.abort();
  }, [triggerKey]);
  ```
- Renders when `suggest_complete === true` AND `localStorage.getItem(\`banner-dismissed:\${sessionId}\`) !== '1'`
- Dismissal persists in `localStorage` keyed by session UUID (survives tab close; scoped to this session only)
- Always-available escape hatch: small "Mark complete" button in the session header regardless of judge state
- **Side effect:** while fixing the cleanup pattern, update the existing Cold Read polling in `chat/page.tsx` to use the same AbortController pattern — same bug, same pass

### Shared changes
- `apps/web/src/lib/chat-stream.ts` — **no changes**. (Earlier spec drafts mentioned a `coverage` SSE handler; that was removed during self-review and is not to be re-added.)
- Token reuse: `completion-banner` calls `useAuth().getToken()` **once before the poll loop**, not per tick.
- Auth token: on 401 in any poll, abort loop and let TanStack surface the error.
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — new widget "Continue your mentor sessions" linking to `/dashboard/sessions` with a mini progress bar across the 4 core sessions.

## 11. Completion UX (end-to-end)

1. Founder lands at `/dashboard/sessions`. Sees 4 core cards (Big Picture highlighted "Recommended") + dim Deep Dive card.
2. Click Big Picture → frontend calls `POST /api/sessions {session_type: "big_picture"}` → backend returns session row (new or existing, via `ON CONFLICT DO NOTHING`) → frontend navigates to `/dashboard/chat/big-picture?session=<uuid>`.
3. Chat page loads, hydrates `sessionId` from URL search param. Renders starter questions if transcript empty.
4. Founder sends messages. Each turn POSTs to `/api/chat/stream` with `session_id=<uuid>` (never optional). Stream replies. After `done`, a BackgroundTask runs `judge_session_coverage` (subject to min-turn floor).
5. Frontend's `completion-banner` polls `GET /api/sessions/{id}` on 2s/3s/5s/8s backoff until `coverage_score` changes or schedule exhausts.
6. If `suggest_complete === true` after poll: banner appears below latest mentor reply: *"I think we've covered the Big Picture — mark this session complete?"* with **Mark complete** and **Keep going** buttons.
7. **Mark complete** → `POST /api/sessions/:id/complete` → mutation `onSuccess` invalidates `["sessions"]` query + navigates to `/dashboard/sessions`. Big Picture now shows checkmark; Problem & Market is "Recommended."
8. **Keep going** → `localStorage.setItem('banner-dismissed:' + sessionId, '1')`; banner hidden for this session. Explicit "Mark complete" button in header still works.

### Deep Dive entry flow
1. All 4 core sessions complete. Dashboard Deep Dive card fetches `GET /api/sessions/deep-dive/recommendation` → `{target_category: "traction", target_signal: "mrr_or_revenue", is_default: false}`.
2. Card renders: "Rebuild your Traction story." Click → confirmation modal showing target category + "Start" button.
3. Confirm → `POST /api/sessions {session_type: "deep_dive", target_category, target_signal}` → new row → navigate to `/dashboard/chat/deep-dive/<sessionId>`.
4. Chat proceeds identically; the per-session system suffix is the dynamic Deep Dive prompt.

### Completed-session behavior
- Navigating to a URL whose session has `completed_at !== null`: the page Server Component loads the session, sees `completed_at`, redirects to `/dashboard/sessions` with a toast "This session is complete — start a new attempt from the overview?"
- "Start new attempt" on a completed card: `POST /api/sessions` — because the unique index is partial on `completed_at IS NULL`, a new row can be inserted; multiple completed sessions of the same type are legal over time.

## 12. Testing (scaled to today's time budget)

### Backend (pytest, 80%+ coverage target)

In scope:
- `tests/unit/test_mentor_sessions_registry.py` — every blueprint has non-empty required fields; every `target_signals` entry is in `KNOWN_SIGNAL_KEYS`; `SessionKey` round-trips via Pydantic
- `tests/unit/test_judge_session_coverage.py` — Instructor mocked; asserts `CoverageResult` validation, threshold gate, min-turn gate, graceful failure on network error
- `tests/unit/test_sessions_repository.py` — creates, reads, updates with monotonic SQL; double-complete returns 0 rows updated
- `tests/integration/test_sessions_api.py` — full CRUD; 422 on invalid `session_type`; 422 on Deep Dive without target fields; 409 on double-complete; 404 on cross-tenant; ON CONFLICT prevents duplicate active session
- `tests/integration/test_chat_stream_session_type.py` — stream with a real `session_id` injects correct suffix; 400 if `session_id` missing; after stream, background judge writes row with monotonic values

### Frontend (Vitest)

In scope:
- `session-grid.test.tsx` — recommended-next across 4 scenarios (all new, 1 done, 3 done, all done → Deep Dive fetch); zod parse failure handled; invalidation on complete
- `completion-banner.test.tsx` — renders/hides on `suggest_complete`; polls with AbortController cleanup verified; localStorage dismissal keyed by session ID

### End-to-end (Playwright)

**Deferred to the day after the demo.** Wall-clock latency of a full structured-session flow (≥ 4 turns × (stream + 2-8s poll) + mark complete + deep dive recommendation) makes this test flaky under CI without deterministic Haiku mocking. A manual dry-run with a seeded demo account replaces this for the pitch.

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Haiku judge fails silently → completion never suggested | Medium | Medium | Instructor auto-retries; PostHog `judge_failed` event for monitoring; always-available manual "Mark complete" button |
| Founder dismisses banner repeatedly → session never closes | High | Low | Header "Mark complete" button always works |
| Two tabs race on session create | Low | Low | Partial unique index + `ON CONFLICT DO NOTHING` |
| Prompt injection via `target_category`/`target_signal` | High | High | Allowlist validation in `CreateSessionRequest`; factory also re-validates; raw strings never f-stringed |
| Transcript poisoning of judge | Medium | Medium | `<transcript>` XML block delimiter + `redact()` on user content + 20-turn bound |
| Deep Dive fires when `signal_scores` empty | High | Low | Fallback recommendation with `is_default: true`; UI surfaces this before start |
| Completed-session URL re-opened → live chat | High | Medium | Server Component detects `completed_at`, redirects with toast |
| Prompt caching breaks | Medium | Medium | Session suffix in non-cached block |
| TanStack stale cache after complete | High | Low | `invalidateQueries(['sessions'])` in mutation onSuccess |
| Polling timer leaks on navigation | Medium | Low | `AbortController` in `useEffect` cleanup |
| Cross-tenant `GET /api/sessions/{id}` access | Low | High | `WHERE id = $1 AND founder_id = $2`; enforced in repo; sqlglot CI lint catches missing predicate |
| Existing MVP sessions show 0% forever | Medium | Medium | One-time backfill job in migration OR demo-reset by sending one additional message |
| `ensure_session` silently accepts session_type mismatch | Medium | Medium | Repo-level validation — if stored type ≠ requested type, raise; chat.py wraps to 400 |

## 14. Out of Scope (consolidated)

- OAuth enrichment (LinkedIn, GitHub)
- Pitch deck upload
- Messaging-app delivery (Slack, WhatsApp)
- Score radar / trend viz
- Rolling summary population
- Engagement Quality Score
- Scoring-engine changes
- Per-section publish/private controls on Cold Reads
- Playwright e2e for structured sessions (deferred to day-after-demo)
- YAML-based blueprints (revisit if prompts iterate daily)
- Admin UI for prompt authoring
- `session_completed` PostHog analytics event (added as L-priority fast-follow)

## 15. Success Criteria

The feature is shippable when:
- A founder completes all 4 core sessions in one afternoon, with the Haiku judge suggesting completion on each within 4-8 turns (subject to the min-turn floor of 3)
- Completing all 4 core sessions unlocks the Deep Dive card with a computed target category (or fallback with `is_default: true` if scoring is thin)
- Reloading the browser mid-session preserves the conversation (session_id in URL, server-side hydration)
- The existing Cold Read generation still fires on turn 3 of any session (unchanged logic, per-session turn counting)
- Navigating to a completed session's URL redirects to the sessions grid with a toast
- Two-tab session creation does not produce duplicate active rows
- All inputs validated at the API boundary — invalid `session_type` / `target_*` values return 422, never 500
- Backend coverage ≥ 80% on new modules
- Vitest suite green for `session-grid` and `completion-banner`
- Playwright e2e deferred and explicitly tracked as day-after-demo work

## 16. Implementation Order (sequenced for today's budget)

1. **Migration + backfill** (30 min) — ALTER, CHECK, partial unique index, optional backfill script
2. **Registry + validators** (30 min) — `mentor_sessions.py` with StrEnum, Pydantic blueprint, factory, allowlists
3. **Judge with Instructor** (45 min) — `judges.py`, `CoverageResult`, monotonic SQL
4. **Sessions repository** (30 min) — `list_by_founder`, `get_by_id_scoped`, `complete`, `create_or_get`
5. **Sessions API routes** (45 min) — `POST /api/sessions`, `GET /api/sessions`, `GET /api/sessions/{id}`, `GET /api/sessions/blueprints`, `GET /api/sessions/deep-dive/recommendation`, `POST /api/sessions/{id}/complete`
6. **Chat stream changes** (30 min) — require `session_id`, thread blueprint through, kick off judge
7. **Zod schema + fetch helpers** (15 min) — `apps/web/src/lib/schemas/session.ts`
8. **Session grid + card + progress ring** (90 min) — TanStack wiring, sorting, Deep Dive gating
9. **Completion banner with AbortController** (45 min) — also retrofit Cold Read polling
10. **Route changes + sessionType guard + Deep Dive route** (45 min) — `notFound()`, completed-session redirect
11. **Dashboard widget + redirect from old /chat** (20 min)
12. **Vitest + pytest suites** (90 min)
13. **Dry run + demo seed account** (60 min)

Total: ~9 hours. Buffer for integration issues. Playwright explicitly excluded.
