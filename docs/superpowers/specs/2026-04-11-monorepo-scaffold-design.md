# ZStar Monorepo Scaffold Design

**Date:** 2026-04-11
**Status:** Approved
**Scope:** Repository structure, tooling, dependencies, dev environment setup

---

## Overview

Scaffold the ZStar (PitchFlow) monorepo — a flat monorepo with pnpm workspaces for TypeScript and uv for Python, unified by a root Makefile. Sets up structure and tooling only; no feature code.

## Repository Structure

```
zstar/
├── apps/
│   └── web/                          # Next.js 15+ App Router
│       ├── src/
│       │   ├── app/                  # App Router pages & layouts
│       │   │   ├── (auth)/           # Clerk auth routes (sign-in, sign-up)
│       │   │   ├── (dashboard)/      # Authenticated founder dashboard
│       │   │   │   ├── chat/         # AI mentor conversation UI
│       │   │   │   ├── profile/      # Founder profile management
│       │   │   │   ├── scores/       # Score breakdown & radar chart
│       │   │   │   └── sessions/     # Session history
│       │   │   ├── (marketing)/      # Landing page, pricing, about
│       │   │   ├── api/              # Next.js API routes (proxy to FastAPI)
│       │   │   │   └── webhooks/     # Clerk webhook receiver
│       │   │   └── layout.tsx
│       │   ├── components/           # App-specific components
│       │   ├── hooks/                # Custom React hooks
│       │   ├── lib/                  # Utilities, API client, constants
│       │   └── styles/              # Global CSS with Tailwind 4 @theme config
│       ├── public/
│       ├── next.config.ts            # Includes transpilePackages: ['@zstar/ui']
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── ui/                           # Shared UI component library (source package)
│       ├── src/
│       │   ├── components/           # shadcn/ui base components
���       │   ├── aceternity/           # Aceternity UI effects
│       │   ├── magic/                # Magic UI micro-interactions
│       │   ├── charts/              # Recharts wrappers (radar, scores)
│       │   └── utils.ts             # cn() helper (clsx + tailwind-merge)
│       ├── tsconfig.json
│       ├── package.json              # name: @zstar/ui, exports: { ".": "./src/index.ts" }
│       └── index.ts                  # Barrel export
│
├── backend/                          # FastAPI Python service
│   ├── src/
│   │   ├── main.py                   # FastAPI app object, uvicorn entry point
│   │   ├── api/                      # Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               # Clerk webhook handlers (svix signature verification)
│   │   │   ├── chat.py               # Mentor conversation endpoints
│   │   │   ├── profiles.py           # Founder profile CRUD
│   │   │   ├── scores.py             # Scoring endpoints
│   │   │   ��── sessions.py           # Mentor session management
│   │   ├── core/                     # App config, dependencies, middleware
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Settings via pydantic-settings
│   │   │   ├── cors.py               # CORSMiddleware configuration
│   │   │   ├── dependencies.py       # verify_clerk_jwt dependency
│   │   │   └── rate_limit.py         # slowapi rate limiting middleware
│   │   ├── db/                       # Database access layer
│   │   │   ├── __init__.py
│   │   │   ├── connection.py         # asyncpg connection pool setup
│   │   │   ├── repositories/         # Repository pattern per entity
│   │   │   ���── vector.py             # pgvector query helpers
│   │   ├── llm/                      # Claude API orchestration layer
│   │   │   ├── __init__.py
│   │   │   ├── client.py             # Anthropic SDK + Instructor setup
│   │   │   ├── conversation.py       # ConversationManager
│   │   │   ├── extraction.py         # Signal extraction schemas
│   │   │   └── prompts.py            # System prompt templates
│   │   ├── models/                   # Pydantic models (request/response)
│   ���   │   └── __init__.py
│   │   ├── scoring/                  # Rules-based scoring engine
│   │   │   └── __init__.py
│   │   └── services/                 # Business logic layer
│   │       └── __init__.py
│   ├── tests/
│   │   └── conftest.py               # Shared fixtures, test DB setup
│   ├── pyproject.toml                # uv project config, uvicorn script entry
│   ├── uv.lock
│   └── .python-version
│
├── supabase/                         # Supabase project config
│   ├── migrations/                   # SQL migration files (with RLS from day one)
│   ├── seed.sql                      # Dev seed data
│   └── config.toml                   # Supabase CLI config
│
├── .github/
│   └── workflows/                    # GitHub Actions CI/CD
│       └── ci.yml                    # lint + typecheck + test (no Supabase in CI)
│
├── docs/                             # Design specs, ADRs
├── Makefile                          # Unified commands across ecosystems
├── pnpm-workspace.yaml
├── package.json                      # Root package.json
├── .gitignore
├── .env.example
└── README.md
```

### Key structural decisions

- **`apps/web/src/app/api/`** — Next.js API routes act as a proxy layer to FastAPI, attaching Clerk JWTs server-side. This avoids CORS for most calls and keeps auth token handling on the server.
- **`packages/ui` is a source package** — no build step, no compiled output. `apps/web` consumes it via `transpilePackages: ['@zstar/ui']` in `next.config.ts`. The package exports raw TypeScript via `"exports": { ".": "./src/index.ts" }`.
- **shadcn/ui initialization** — run `npx shadcn@latest init` inside `apps/web`, then move generated components to `packages/ui/src/components/` and update import paths. The shadcn CLI requires a Next.js context; it cannot run directly in `packages/ui`.
- **`backend/src/main.py`** — the FastAPI `app` object lives here. uvicorn entry: `uvicorn src.main:app --reload`. Defined in `pyproject.toml` under `[tool.uv.scripts]`.
- **All Python packages include `__init__.py`** — required for Python to treat directories as packages.
- **Browser extension is explicitly OUT of scope** — cut from Phase 1 to reduce surface area. No `apps/extension/` directory. Will be added in Phase 2 if needed.

## Tech Stack & Dependencies

### Frontend (apps/web)

| Category      | Package                           | Purpose                                                        |
| ------------- | --------------------------------- | -------------------------------------------------------------- |
| Framework     | `next` 15+                        | App Router, SSR                                                |
| React         | `react` 19+                       | UI rendering                                                   |
| Styling       | `tailwindcss` 4+                  | Utility-first CSS (CSS-first config, no tailwind.config.ts)    |
| Auth          | `@clerk/nextjs`                   | OAuth flows, session management                                |
| Animation     | `framer-motion` ^11               | Powers Aceternity + Magic UI (pinned v11+ for React 19 compat) |
| Charts        | `recharts`                        | Radar charts, score visualizations                             |
| Forms         | `react-hook-form` + `zod`         | Schema-first form validation                                   |
| Data fetching | `@tanstack/react-query`           | Server state management, caching, optimistic updates           |
| Testing       | `vitest` + `@vitejs/plugin-react` | Unit tests                                                     |
| Testing       | `@testing-library/react`          | Component tests                                                |
| Testing       | `@playwright/test`                | E2E tests                                                      |

**Note on state management:** No Zustand in the initial scaffold. React state + TanStack Query covers Phase 1 needs (mentor chat + dashboard data fetching). Add Zustand only if multiple unrelated client stores need to share state.

### UI Package (packages/ui)

| Category   | Package                   | Purpose                         |
| ---------- | ------------------------- | ------------------------------- |
| Primitives | `@radix-ui/*`             | Accessible headless components  |
| Icons      | `lucide-react`            | Icon set                        |
| Utilities  | `clsx` + `tailwind-merge` | Class name composition          |
| Animation  | `framer-motion` ^11       | Peer dependency shared with web |

### Backend (backend/)

| Category   | Package                               | Purpose                              |
| ---------- | ------------------------------------- | ------------------------------------ |
| Framework  | `fastapi`                             | Async API framework                  |
| Server     | `uvicorn[standard]`                   | ASGI server                          |
| Validation | `pydantic` v2                         | Request/response models              |
| Settings   | `pydantic-settings`                   | Env var config                       |
| LLM        | `anthropic`                           | Claude API SDK                       |
| Extraction | `instructor`                          | Structured output + retry            |
| Database   | `asyncpg`                             | PostgreSQL driver (single DB client) |
| Vector     | `pgvector`                            | pgvector Python bindings             |
| Auth       | `pyjwt[crypto]` + `httpx`             | Clerk JWT verification via JWKS      |
| Webhooks   | `svix`                                | Clerk webhook signature verification |
| Rate limit | `slowapi`                             | Request rate limiting                |
| CORS       | (built into FastAPI)                  | `CORSMiddleware` from `starlette`    |
| Testing    | `pytest` + `httpx` + `pytest-asyncio` | Async test stack                     |
| Linting    | `ruff`                                | Linter + formatter                   |
| Types      | `pyright`                             | Static type checking (strict)        |

**Note on database clients:** Single client — `asyncpg` only. No `supabase-py` in the backend. Supabase is used for managed PostgreSQL hosting and migrations via CLI, but all backend database access goes through `asyncpg` directly. This avoids dual connection pools and inconsistent transaction boundaries.

### Infrastructure

| Tool           | Purpose                                        |
| -------------- | ---------------------------------------------- |
| `supabase` CLI | Migrations, local dev, seed data               |
| `pnpm`         | JS package management + workspaces             |
| `uv`           | Python dependency management                   |
| `make`         | Unified commands                               |
| `concurrently` | Labeled parallel process runner for `make dev` |

## Development Environment

### Makefile commands

```
make dev          # Starts Next.js + FastAPI + Supabase local in parallel (via concurrently)
make dev:web      # Next.js only
make dev:api      # FastAPI only (uvicorn src.main:app --reload)
make dev:db       # Supabase local
make test         # All tests (frontend + backend)
make test:web     # Vitest
make test:api     # pytest
make test:e2e     # Playwright E2E
make lint         # ESLint + Ruff
make format       # Prettier + Ruff format
make typecheck    # tsc --noEmit + pyright
make db:migrate   # Run pending Supabase migrations
make db:reset     # Reset local DB + re-seed
make db:seed      # Seed dev data
make db:diff      # Auto-generate migration from schema changes
make ci           # lint + typecheck + test (mirrors GitHub Actions)
make setup        # Full first-time setup
```

**`make dev` uses `concurrently`** (npm package) to run all three services with color-coded, labeled output. Each service's stdout is prefixed with `[web]`, `[api]`, or `[db]` so errors are traceable. This replaces raw background processes which produce unreadable interleaved output.

### Local development flow

1. `make setup` installs pnpm deps, creates Python venv via uv, initializes Supabase, copies `.env.example` to `.env`
2. `make dev` starts all services in parallel (Next.js `:3000`, FastAPI `:8000`, Supabase Studio `:54323`)
3. Supabase local provides PostgreSQL + pgvector + Studio GUI

### Tailwind 4 configuration

Tailwind 4 uses CSS-first configuration. There is no `tailwind.config.ts` file.

```css
/* apps/web/src/styles/globals.css */
@import "tailwindcss";

/* Source packages/ui so its classes are not purged */
@source "../../../../packages/ui/src/**/*.{ts,tsx}";

@theme {
  /* Dark-first color palette chosen via ui-ux-pro-max */
  --color-background: /* deep slate */;
  --color-foreground: /* light gray */;
  --color-primary: /* purple/violet */;
  --color-accent: /* cyan */;
  /* ... full palette defined during implementation */
}
```

The `@source` directive is critical — without it, Tailwind purges utility classes used in `packages/ui` components.

### TypeScript config

- `strict: true` everywhere
- Path aliases: `@/` maps to `src/`
- Target: ES2022, module: ESNext
- `apps/web/next.config.ts` includes `transpilePackages: ['@zstar/ui']`

### Python config

- Python 3.12+, managed by uv
- `ruff` for linting + formatting
- `pyright` strict mode
- All functions type-hinted, all models Pydantic v2
- Entry point: `uvicorn src.main:app --reload` (defined in `pyproject.toml [tool.uv.scripts]`)

### Environment variables

```bash
# Clerk (frontend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Clerk (server-only — NEVER prefix with NEXT_PUBLIC_)
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=          # svix signature verification
CLERK_JWKS_URL=                # e.g. https://<your-clerk>.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=                  # e.g. https://<your-clerk>.clerk.accounts.dev

# Supabase (frontend — safe to expose)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server-only — bypasses RLS, NEVER expose to frontend)
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                  # Direct PostgreSQL connection, FastAPI-only

# Anthropic (server-only)
ANTHROPIC_API_KEY=

# Upstash Redis (server-only) — DEFERRED, add when needed
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Security annotations:** Variables prefixed `NEXT_PUBLIC_` are bundled into client JavaScript. All other variables are server-only. `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` bypass RLS and must never be accessible from the frontend.

**Redis is deferred:** Upstash env vars are commented out. PostgreSQL handles session state at Phase 1 scale. Add Redis when load testing shows PostgreSQL latency on session reads.

## Architecture

### Request flow

```
Browser → Next.js (Clerk middleware validates session)
  → Server Component or API Route
    → Two paths:
      a. Next.js API route proxies to FastAPI (attaches Clerk JWT server-side, avoids CORS)
      b. Direct client → FastAPI (requires CORS, used for streaming responses)
        → FastAPI CORSMiddleware (allows apps/web origin only)
        → FastAPI rate limiting (slowapi, per-user via Clerk user ID)
          → verify_clerk_jwt dependency (validates JWT via JWKS endpoint)
            → Business logic → asyncpg (PostgreSQL) / Claude API
```

### CORS configuration

FastAPI `CORSMiddleware` in `backend/src/core/cors.py`:

- `allow_origins`: `[NEXT_PUBLIC_API_URL]` (localhost:3000 in dev, production URL in prod)
- `allow_methods`: `["GET", "POST", "PUT", "DELETE"]`
- `allow_headers`: `["Authorization", "Content-Type"]`
- `allow_credentials`: `True`

Most requests are proxied through Next.js API routes (path `a` above), avoiding CORS entirely. Direct client-to-FastAPI calls (path `b`) are used only for streaming mentor responses where proxy buffering would add latency.

### Conversation data flow

```
1. Founder types message in chat UI
2. Next.js POST /api/chat/message { session_id, content }
   → proxies to FastAPI with Clerk JWT attached server-side
3. FastAPI ConversationManager:
   a. Loads conversation history from mentor_messages table (asyncpg)
   b. Loads founder profile + score gaps
   c. Builds system prompt (mentor persona + topic + signals to extract)
   d. Calls Claude API via Instructor
   e. Returns { mentor_response, extracted_signals[], confidence_scores }
4. FastAPI:
   a. Inserts message + response into mentor_messages table
   b. Updates founder profile with new signals
   c. Recalculates scores if signals changed
5. Returns { response, updated_signals, score_delta } to frontend
6. Chat UI renders response + animates score changes
```

### Scoring engine

```
Signal inputs (conversation + OAuth data)
  → Category scorers (one per rubric category)
    → Weighted aggregation
      → Tier assignment

Tiers:
  "Investor Ready"       (80-100)
  "Almost There"         (60-79)
  "Building Momentum"    (40-59)
  "Early Stage"          (20-39)
  "Just Getting Started" (0-19)
```

### Frontend vs Backend responsibility

| Frontend (Next.js)                       | Backend (FastAPI)                        |
| ---------------------------------------- | ---------------------------------------- |
| Renders UI, manages chat state           | All business logic                       |
| Clerk auth (session, OAuth redirects)    | JWT verification via JWKS                |
| Optimistic UI updates via TanStack Query | Source of truth for all data             |
| Client-side validation (Zod)             | Server-side validation (Pydantic)        |
| Proxies API calls to FastAPI             | Calls Claude API, asyncpg, (Redis later) |
| Never talks to Claude directly           | Owns the LLM orchestration layer         |

## Database Schema (First Migration)

### Design decisions

- **Primary keys:** UUIDv7 (time-ordered) via `uuid_generate_v7()` — globally unique, no index fragmentation from random UUIDs
- **Single DB client:** `asyncpg` only — no `supabase-py` in backend
- **RLS enabled from day one** on all tables
- **`conversation_history` normalized** into `mentor_messages` child table — avoids full-row rewrites on every message append
- **`extracted_signals` normalized** into `session_signals` table — enables querying signals across sessions
- **FK indexes created explicitly** — PostgreSQL does not auto-index foreign keys

### Phase 1 tables

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_uuidv7";

-- Founders
CREATE TABLE founders (
  id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  linkedin_data JSONB,            -- enriched OAuth profile (schema varies)
  github_data JSONB,              -- enriched OAuth profile (schema varies)
  timezone TEXT,                  -- for scheduling and session timestamps
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON founders (clerk_user_id);
CREATE UNIQUE INDEX ON founders (email);

-- Startup Profiles
CREATE TABLE startup_profiles (
  id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
  founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  company_name TEXT,
  one_liner TEXT,
  market_category TEXT,
  stage TEXT CHECK (stage IN ('pre_seed', 'seed', 'series_a')),
  raise_amount BIGINT,
  pitch_sections JSONB,           -- structured pitch content (founder-controlled blobs)
  published_sections TEXT[],      -- which sections are public
  embedding vector(1536),         -- semantic search over profile content
  embedding_model TEXT,           -- e.g. 'text-embedding-3-small'
  embedded_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,         -- soft delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON startup_profiles (founder_id);
CREATE INDEX ON startup_profiles (founder_id) WHERE deleted_at IS NULL;
CREATE INDEX ON startup_profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Signal Scores
CREATE TABLE signal_scores (
  id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
  startup_profile_id UUID NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
  overall_score SMALLINT NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  category_scores JSONB NOT NULL,  -- per-category breakdown (read-only audit data)
  signal_details JSONB NOT NULL,   -- individual signal values
  engagement_quality_score SMALLINT CHECK (engagement_quality_score BETWEEN 0 AND 100),
  scoring_version TEXT NOT NULL,   -- rubric version e.g. 'v1.0.0'
  scoring_config JSONB,            -- snapshot of weights used at compute time (audit trail)
  triggered_by TEXT,               -- 'session_complete' | 'manual_refresh' | 'cron'
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX ON signal_scores (startup_profile_id);
CREATE INDEX ON signal_scores (overall_score DESC);
CREATE INDEX ON signal_scores (computed_at DESC);
CREATE INDEX ON signal_scores USING gin (category_scores);

-- Mentor Sessions
CREATE TABLE mentor_sessions (
  id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
  founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES startup_profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN (
    'big_picture', 'problem_market', 'business', 'ask', 'deep_dive'
  )),
  session_summary TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX ON mentor_sessions (founder_id);
CREATE INDEX ON mentor_sessions (startup_profile_id);

-- Mentor Messages (normalized from conversation_history JSONB)
CREATE TABLE mentor_messages (
  id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON mentor_messages (session_id, created_at);

-- Session Signals (normalized from extracted_signals JSONB)
CREATE TABLE session_signals (
  id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES mentor_messages(id) ON DELETE SET NULL,
  signal_key TEXT NOT NULL,
  signal_value JSONB NOT NULL,
  confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON session_signals (session_id);
CREATE INDEX ON session_signals (signal_key);

-- Row-Level Security
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (founder sees only their own data)
CREATE POLICY "founders_self" ON founders
  FOR ALL USING (clerk_user_id = (SELECT auth.uid()::text));

CREATE POLICY "startup_profiles_owner" ON startup_profiles
  FOR ALL USING (
    founder_id IN (SELECT id FROM founders WHERE clerk_user_id = (SELECT auth.uid()::text))
  );

CREATE POLICY "signal_scores_owner" ON signal_scores
  FOR ALL USING (
    startup_profile_id IN (
      SELECT sp.id FROM startup_profiles sp
      JOIN founders f ON sp.founder_id = f.id
      WHERE f.clerk_user_id = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "mentor_sessions_owner" ON mentor_sessions
  FOR ALL USING (
    founder_id IN (SELECT id FROM founders WHERE clerk_user_id = (SELECT auth.uid()::text))
  );

CREATE POLICY "mentor_messages_owner" ON mentor_messages
  FOR ALL USING (
    session_id IN (
      SELECT ms.id FROM mentor_sessions ms
      JOIN founders f ON ms.founder_id = f.id
      WHERE f.clerk_user_id = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "session_signals_owner" ON session_signals
  FOR ALL USING (
    session_id IN (
      SELECT ms.id FROM mentor_sessions ms
      JOIN founders f ON ms.founder_id = f.id
      WHERE f.clerk_user_id = (SELECT auth.uid()::text)
    )
  );

-- Revoke default public access
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO authenticated;
```

## Design Tooling Workflow

During frontend development, the following tools are used:

| Step               | Tool                           | Purpose                                |
| ------------------ | ------------------------------ | -------------------------------------- |
| Design decisions   | `ui-ux-pro-max` skill          | Color palette, typography, UX patterns |
| Component sourcing | `21st.dev` MCP builder         | Search premium component snippets      |
| Component building | shadcn + Aceternity + Magic UI | Code into `packages/ui/`               |
| Component polish   | `21st.dev` MCP refiner         | Refine for better aesthetics           |
| Logos              | `21st.dev` logo search         | SVG/TSX company logos                  |
| Inspiration        | `21st.dev` MCP inspiration     | Browse component previews              |

## Scope

### IN (scaffold delivers)

- Monorepo structure with all directories
- pnpm workspace config with `@zstar/ui` source package
- Next.js 15+ with App Router, TypeScript strict, Tailwind 4 (CSS-first config)
- `transpilePackages` configured for `@zstar/ui` in `next.config.ts`
- Clerk auth wired up (middleware, sign-in/sign-up, provider)
- Next.js API routes (`app/api/`) for proxying to FastAPI
- shadcn/ui initialized (init in `apps/web`, components moved to `packages/ui`)
- FastAPI project with uv, pyproject.toml, ruff, pyright, uvicorn entry point
- FastAPI CORS middleware configured for Next.js origin
- FastAPI rate limiting stub via slowapi
- Clerk JWT verification dependency (`verify_clerk_jwt` via JWKS)
- Clerk webhook handler with svix signature verification
- `backend/src/db/` with asyncpg connection pool and repository pattern
- Supabase initialized (config.toml, first migration with Phase 1 tables + RLS policies)
- First migration includes: founders, startup_profiles, signal_scores, mentor_sessions, mentor_messages, session_signals — all with RLS enabled, FK indexes, and UUIDv7 PKs
- pgvector embedding column on startup_profiles with ivfflat index
- Makefile with all commands including `make ci`
- `concurrently` for labeled parallel dev server output
- .env.example with all keys and security annotations
- .gitignore for both ecosystems
- Dark-first Tailwind theme (via ui-ux-pro-max)
- Working `make dev` that starts all services with labeled output
- GitHub Actions CI skeleton (lint, typecheck, test — no Supabase in CI, mocks DB)
- Root README with setup instructions

### OUT (built later)

- AI mentor conversation engine (Month 2)
- Signal extraction pipeline
- Scoring engine implementation
- Dashboard pages (profile, scores, sessions)
- OAuth enrichment (LinkedIn/GitHub data import)
- Seed data / synthetic personas
- E2E tests (added as features are built)
- Deployment config (Vercel/Railway)
- Browser extension (cut from Phase 1 to reduce surface area)
- Redis/Upstash (deferred until load testing shows need)
- Zustand (deferred until multiple client stores need shared state)

### First feature after scaffold

Clerk auth flow: sign up, sign in, protected dashboard layout, user synced to Supabase `founder` table via Clerk webhook. Validates the full frontend → backend → database chain.

## Hosting Stack

| Layer     | Service               | Est. Cost (0-1000 users) |
| --------- | --------------------- | ------------------------ |
| Frontend  | Vercel                | $0-20/mo                 |
| Backend   | Railway               | $5-20/mo                 |
| Database  | Supabase              | $0-25/mo                 |
| Cache     | Upstash (when needed) | $0-5/mo                  |
| Errors    | Sentry                | Free tier                |
| Analytics | PostHog               | Free tier (1M events)    |

## Decisions Log

| Decision             | Choice                                        | Rationale                                                                                               |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Monorepo style       | Flat (Approach A)                             | One app, one service — promote to Approach B when second consumer appears                               |
| Package manager      | pnpm                                          | Fast, disk-efficient, best workspace support                                                            |
| Python deps          | uv                                            | Fastest, modern lockfiles, auto-virtualenv                                                              |
| Database             | Supabase (managed PostgreSQL + pgvector)      | Simplifies infra, built-in migrations, RLS, storage                                                     |
| DB client            | asyncpg only (no supabase-py in backend)      | Single connection pool, consistent transactions, direct pgvector access                                 |
| DB primary keys      | UUIDv7 (time-ordered)                         | Globally unique without index fragmentation of UUIDv4                                                   |
| Auth                 | Clerk                                         | First-class LinkedIn OAuth, best Next.js DX                                                             |
| UI                   | shadcn/ui + Aceternity + Magic UI + Recharts  | Premium aesthetics, zero lock-in, RSC compatible                                                        |
| LLM orchestration    | Anthropic SDK + Instructor                    | Minimal deps, best structured extraction. Monitor if Instructor features beyond basic tool_use are used |
| State management     | TanStack Query (no Zustand initially)         | Server state is the primary need; add Zustand when client stores require shared state                   |
| Cache                | Deferred (no Redis in Phase 1)                | PostgreSQL handles session state at low scale; add Upstash when load testing shows need                 |
| Backend hosting      | Railway                                       | Fastest Docker deploy, low ops                                                                          |
| Testing              | Vitest + Playwright + pytest                  | Best-in-class per ecosystem                                                                             |
| Monitoring           | Sentry + PostHog (no Grafana in Phase 1)      | Minimal, free-tier, zero-ops                                                                            |
| Orchestration        | pnpm workspaces + Makefile                    | Simple, no Turborepo/Nx needed yet. Swap to `just` if Windows devs join                                 |
| Dev server runner    | concurrently                                  | Labeled parallel output, better than raw Make background processes                                      |
| Tailwind config      | CSS-first (Tailwind 4, no tailwind.config.ts) | @theme blocks in CSS, @source for packages/ui                                                           |
| packages/ui strategy | Source package (no build step)                | transpilePackages in Next.js, raw TS exports                                                            |
| Conversation storage | Normalized mentor_messages table              | Avoids JSONB full-row rewrites on every message                                                         |
| Signal storage       | Normalized session_signals table              | Enables cross-session signal queries                                                                    |
| RLS                  | Enabled in first migration                    | Retrofitting after data exists is dangerous                                                             |
| CORS                 | FastAPI CORSMiddleware + Next.js API proxy    | Most requests proxied (no CORS), direct calls for streaming only                                        |
| Rate limiting        | slowapi stub in scaffold                      | Protects Claude API cost and DoS surface                                                                |
| Webhook security     | svix signature verification                   | Prevents forged Clerk webhook events                                                                    |

## Review Issues Addressed

This spec was reviewed by 5 independent agents (architecture, security, practical implementation, devil's advocate, database). All 26 identified issues have been addressed:

**Critical (8):** Tailwind 4 config, shadcn init strategy, CORS, webhook verification, dual DB clients, conversation_history normalization, RLS in first migration, FK indexes
**High (10):** db/ layer, API routes directory, FastAPI entry point, transpilePackages, test deps, rate limiting, pgvector column, MentorSession FK, CLERK_JWKS_URL, UUIDv7
**Medium (8):** Zustand deferred, Redis deferred, packages/ui docs, labeled dev output, make ci, scoring_config snapshot, extension exclusion explicit, pytest-asyncio
