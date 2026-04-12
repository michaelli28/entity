# Structured Mentor Sessions — Design Spec

**Date:** 2026-04-12
**Author:** Design via brainstorming dialogue
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
- Make the mentor feel structured and purposeful — investors and founders should feel the 4-session arc within 10 seconds of landing
- Preserve all existing pipelines (signal extraction, Cold Read, scoring) without code changes to them
- Ship Deep Dive mode in the same feature cycle so the mentor reads as a coach, not an intake form
- URL-addressable sessions (fix the sessionId-on-reload regression as a byproduct)
- Additive-only migration — no data loss, no breaking changes to existing `/api/chat/stream` callers

### Non-Goals (explicit cuts)
- OAuth enrichment (LinkedIn / GitHub data pull) — deferred, see PRD §5.5
- Pitch deck / document upload — separate feature
- Messaging-app delivery (Slack, WhatsApp) — Phase 1.5
- Score radar / trend visualization — separate feature, different spec
- Rolling session summary population — handled by an existing `rolling_summary` hook, filling it is a perf project
- Engagement Quality Score (PRD §5.2) — needs historical data
- Changes to the scoring engine — it's already session-agnostic
- Per-section publish/private controls on the Cold Read

## 3. Key Decisions (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Completion semantics | Hybrid: LLM-suggested + user-confirmed | Proactive guidance without removing agency; demos as "the mentor knows when you're ready" |
| Navigation | Soft-linear: all clickable, one "Recommended" highlight | Avoids paternalistic locks; investor demos allow clicking around |
| Deep Dive | Shipped in this feature | Turns the mentor from intake form into coach |
| URL shape | Route per session type | Reload-safe, shareable, aligns with App Router idioms |
| Architecture | Registry module (`SessionBlueprint` dataclasses) | Single source of truth; adding a session = data edit |
| Judge model | Haiku 4.5 | Classification task, not coaching; ~10% the cost of Sonnet |

## 4. Architecture

A new registry module `backend/src/llm/mentor_sessions.py` holds one `SessionBlueprint` dataclass per core session plus a runtime factory for Deep Dives. The chat endpoint consults the registry for the per-session system-prompt suffix, target signals, and completion-judge prompt. A post-turn BackgroundTask runs a Haiku-based coverage judge; when coverage crosses a threshold, the session is flagged `suggest_complete = true` and the frontend shows a "Mark complete?" banner. The founder confirms; the session is marked complete; the next recommended session is highlighted.

Frontend moves from a single `/dashboard/chat` page to a session-aware surface:
- `/dashboard/sessions` — overview grid of the 5 cards (4 core + Deep Dive)
- `/dashboard/chat/[sessionType]` — one of the 4 core session routes
- `/dashboard/chat/deep-dive/[sessionId]` — deep-dive chat keyed by session ID

The existing `/api/chat/stream` endpoint is extended (not replaced). Signal extraction, Cold Read generation, and scoring continue firing off the same stream with no changes.

## 5. Data Model

One additive migration: `supabase/migrations/20260412220000_structured_sessions.sql`.

```sql
ALTER TABLE mentor_sessions
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN coverage_score INT NOT NULL DEFAULT 0,
    ADD COLUMN suggest_complete BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_mentor_sessions_founder_type
    ON mentor_sessions (founder_id, session_type, started_at DESC);
```

- `metadata` — JSONB bag. For Deep Dives: `{"target_category": "traction", "target_signal": "mrr_or_revenue"}`. Room for future per-session flags without new migrations.
- `coverage_score` — 0-100 from the Haiku judge. Displayed as progress % on the dashboard card.
- `suggest_complete` — boolean the judge flips when coverage ≥ 75. Frontend reads it to render the completion banner.
- Existing `completed_at` stays — set when the founder explicitly confirms.

The `session_type` enum already allows `big_picture | problem_market | business | ask | deep_dive` (existing `init` migration). No enum changes needed.

## 6. Backend Registry

New file `backend/src/llm/mentor_sessions.py`:

```python
from dataclasses import dataclass
from typing import Literal

SessionKey = Literal["big_picture", "problem_market", "business", "ask", "deep_dive"]

@dataclass(frozen=True)
class SessionBlueprint:
    key: SessionKey
    title: str
    subtitle: str
    order: int                          # 1-4 for core, 99 for deep_dive
    system_suffix: str                  # appended to MENTOR_IDENTITY
    target_signals: tuple[str, ...]     # signal keys this session extracts
    completion_prompt: str              # instructions for the Haiku judge
    starter_questions: tuple[str, ...]  # quick-reply chips on empty state
```

Four core blueprints are module-level constants: `BIG_PICTURE`, `PROBLEM_MARKET`, `BUSINESS`, `ASK`, matching PRD §5.1. The Deep Dive blueprint is constructed at runtime by `make_deep_dive_blueprint(target_category, target_signal)`.

Module-level exports:
- `CORE_BLUEPRINTS: tuple[SessionBlueprint, ...]` — the 4 in order
- `BY_KEY: dict[str, SessionBlueprint]` — lookup by key
- `make_deep_dive_blueprint(target_category, target_signal) -> SessionBlueprint`

### Prompt content per core session (summary)

- **Big Picture** — founder background, product description, ICP (specific, not segment), timing thesis
- **Problem & Market** — pain points with evidence, TAM/SAM/SOM, competition, moat/unfair advantage
- **Business** — pricing, traction (quantified), GTM, team composition
- **Ask** — round size, terms, pipeline status, non-capital help

Full prompt text will be authored during implementation, scaled to 4-8 sentences per `system_suffix`.

## 7. Context Builder Change

`backend/src/llm/context_builder.py` — one-line change in `build_messages_and_system`:

```python
system_blocks = build_cached_system(
    [
        (identity, True),                       # cached (stable)
        (profile_block, True),                  # cached (stable per founder)
        (blueprint.system_suffix, False),       # NEW: per-session framing, not cached
        (retrieved, False),                     # not cached (stage-varying)
    ]
)
```

The session suffix sits in a non-cached block so prompt caching on identity + profile is preserved. The function takes a new `blueprint: SessionBlueprint` parameter passed in from `chat.py`.

## 8. Completion Judge

New file `backend/src/llm/judges.py`:

```python
async def judge_session_coverage(
    blueprint: SessionBlueprint,
    transcript: list[dict[str, str]],  # recent messages, role + content
) -> CoverageResult:
    """Haiku 4.5 rates how well the session's target topics are covered.
    Returns CoverageResult(coverage_score: int, missing: list[str], rationale: str)."""
```

- Called from `BackgroundTasks` after each SSE stream finishes, same lifecycle as the existing signal extraction task
- Writes `coverage_score` and `suggest_complete` back to `mentor_sessions`
- Failures (timeout, bad JSON, API error) are swallowed with structlog `exception()`; the row stays at its last value
- Threshold: `suggest_complete = true` when `coverage_score >= 75`
- Idempotent: rerunning does not flip `suggest_complete` back to false once true, but can raise `coverage_score`

## 9. API Surface

All endpoints sit behind the existing `verify_clerk_jwt` dependency. All DB writes use the `app.current_founder_id` session variable pattern for tenant isolation (RLS-disabled per ADR in memory #713).

### Changed
- `POST /api/chat/stream`
  - Body now accepts optional `session_type: str` (defaults to first incomplete core session for that founder, or `big_picture` on first use)
  - Body now accepts optional `target_category: str` and `target_signal: str` (required when `session_type == "deep_dive"` on first turn)
  - SSE event shape is unchanged; judge result is not streamed inline (see §11 for the polling flow that matches the existing Cold Read pattern)

### New
- `GET /api/sessions/blueprints` — returns 4 core blueprints as public metadata (key, title, subtitle, order, starter_questions). No prompts exposed. Response is stable, cacheable.
- `GET /api/sessions` — list the authenticated founder's sessions:
  ```json
  [{"id": "...", "session_type": "big_picture", "started_at": "...",
    "completed_at": null, "coverage_score": 42, "suggest_complete": false,
    "metadata": {}}]
  ```
- `POST /api/sessions` — create a session. Body `{session_type, target_category?, target_signal?}`. Returns the full row. For Deep Dives, `target_category` and `target_signal` are required and written to `metadata`.
- `POST /api/sessions/{id}/complete` — sets `completed_at = now()`. Returns 409 if already complete. Returns 404 if not owned by the authenticated founder.

### Unchanged
- `/api/cold-reads/latest`, `/api/cold-reads/{id}` — continue working
- `/api/founders/me`, `/api/founders/me/export` — unchanged
- `/api/score/current` — unchanged (scoring is session-agnostic)

## 10. Frontend

### Routes (Next.js App Router)

```
apps/web/src/app/(dashboard)/dashboard/
├── sessions/
│   └── page.tsx              NEW
├── chat/
│   ├── page.tsx              CHANGED — redirect("/dashboard/sessions")
│   ├── [sessionType]/
│   │   └── page.tsx          NEW
│   └── deep-dive/
│       └── [sessionId]/
│           └── page.tsx      NEW
```

### Components

```
apps/web/src/components/sessions/
├── session-card.tsx          card UI: title, subtitle, progress %, status badge
├── session-grid.tsx          5-card grid with soft-linear recommended highlight
├── session-progress-ring.tsx radial ring 0-100 from coverage_score
├── completion-banner.tsx     "Mark complete?" banner with Mark / Keep going
└── starter-questions.tsx     quick-reply chips for empty-state sessions
```

### `session-grid.tsx` logic
- Fetches `/api/sessions/blueprints` once via TanStack Query (long cache)
- Fetches `/api/sessions` with 30s cache
- Merges blueprint + latest session of that type (if any)
- "Recommended" pill = first incomplete core session in order
- No hard locks; every card is clickable
- Deep Dive card shows "Complete your 4 core sessions to unlock" until all 4 have `completed_at != null`, then shows "Start Deep Dive on [target_category]"

### `completion-banner.tsx` logic
- After each streamed reply ends (`done` event from `streamChat`), polls `GET /api/sessions/{id}` with a short backoff schedule (2s, 3s, 5s, 8s) until `coverage_score` changes or budget exhausts — mirrors the existing Cold Read polling in `chat/page.tsx`
- Renders when `suggest_complete === true` AND user has not dismissed this session locally
- Dismissal persists per session in `sessionStorage`
- Always-available escape hatch: small "Mark complete" button in the session header regardless of judge state

### Shared changes
- `apps/web/src/lib/chat-stream.ts` — handle the new `coverage` SSE event (~10 lines)
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — new widget "Continue your mentor sessions" linking to `/dashboard/sessions`
- Current `/dashboard/chat/page.tsx` becomes a redirect, preserving old bookmarks

## 11. Completion UX (end-to-end)

1. Founder lands at `/dashboard/sessions`, sees 4 core cards + dim Deep Dive card. Big Picture is marked "Recommended."
2. Click → lands at `/dashboard/chat/big-picture`. If no session row exists for this founder + `big_picture`, backend creates one on first message.
3. Founder sends messages. Each turn streams a Sonnet reply via `/api/chat/stream`.
4. After each stream's `done` event, a FastAPI BackgroundTask runs the Haiku judge and writes `coverage_score` + `suggest_complete` to `mentor_sessions`. The frontend polls `GET /api/sessions/{id}` on a 2s/3s/5s/8s backoff schedule until it sees a coverage change or the schedule exhausts. Same pattern as the existing Cold Read polling.
5. When the polled session state shows `suggest_complete === true`, the banner appears below the latest mentor reply: *"I think we've covered the Big Picture — mark this session complete?"*
6. Click **Mark complete** → `POST /api/sessions/:id/complete` → redirect to `/dashboard/sessions`. Big Picture now has a checkmark; Problem & Market is highlighted as "Recommended."
7. After all 4 cores complete, the Deep Dive card lights up with the computed target category ("Rebuild your Traction story"). Click → backend creates a deep-dive session, computes `target_signal`, redirects to `/dashboard/chat/deep-dive/[sessionId]`.

## 12. Testing

### Backend (pytest, 80%+ coverage target)

- `tests/unit/test_mentor_sessions_registry.py` — every blueprint has non-empty required fields; all keys are in the enum; `target_signals` is a subset of known signal keys
- `tests/unit/test_judge_session_coverage.py` — mocked Anthropic client; asserts JSON parsing, threshold behavior, graceful bad-JSON handling
- `tests/integration/test_sessions_api.py` — create, list, complete; 409 on double-complete; 404 on cross-tenant access
- `tests/integration/test_chat_stream_session_type.py` — SSE stream with `session_type=problem_market` injects the correct system suffix; after stream closes, background judge writes `coverage_score` and `suggest_complete` to the row

### Frontend (Vitest)

- `session-grid.test.tsx` — recommended-next highlights correctly across 4 scenarios (all new, 1 done, 3 done, all done → deep dive unlocked)
- `completion-banner.test.tsx` — renders when `suggest_complete=true`; hidden when dismissed in sessionStorage

### End-to-end (Playwright)

- `e2e/structured-sessions.spec.ts` — full flow: sign in → `/dashboard/sessions` → click Big Picture → send 4 turns → see completion banner → click Mark complete → return to sessions grid with checkmark on Big Picture and Problem & Market highlighted

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Haiku judge returns bad JSON → no completion nudge | Medium | Low | try/except; swallow, log, retry next turn |
| Founder dismisses completion repeatedly → session never closes | High | Low | Explicit "Mark complete" button always available in session header |
| Judge result polling budget exhausts before Haiku finishes | Low | Low | Banner will appear on next chat turn or on session page revisit; `suggest_complete` persists in DB |
| Prompt caching breaks | Medium | Medium | Suffix lives in non-cached block; identity + profile remain cached per founder |
| Deep Dive unlock looks dead ("why can't I click?") | High | Low | Card shows explicit "Complete 4 core sessions first" copy, not a padlock |
| First-turn creation race (two tabs starting same session type) | Low | Low | Use `SELECT ... FOR UPDATE` when creating first session of a type, or treat unique-violation as "fetch existing" |

## 14. Out of Scope

Listed in §2 Non-Goals. Items deliberately excluded from this spec:
- OAuth enrichment (LinkedIn, GitHub)
- Pitch deck upload
- Messaging-app delivery (Slack, WhatsApp)
- Score radar / trend viz
- Rolling summary population
- Engagement Quality Score
- Scoring-engine changes
- Per-section publish/private controls on Cold Reads

## 15. Success Criteria

The feature is shippable when:
- A founder completes all 4 core sessions in one afternoon, with the Haiku judge suggesting completion on each within 4-8 turns
- Completing all 4 core sessions unlocks the Deep Dive card, which correctly identifies the lowest-scoring category from `signal_scores`
- Reloading the browser mid-session does not lose the conversation
- The existing Cold Read generation still fires on turn 3 of any session
- Playwright e2e test passes end-to-end
- Backend coverage ≥ 80% on new modules
