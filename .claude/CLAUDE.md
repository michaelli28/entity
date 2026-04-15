# Entity (PitchFlow) - Project Guidelines

## Project Overview

AI-powered founder profiling and deal flow platform. Phase 1: AI mentor + signal scoring + founder dashboard. Phase 2: Investor marketplace.

## Tech Stack

- **Frontend:** Next.js 15+ (App Router), React 19+, TypeScript strict, Tailwind CSS 4 (CSS-first config)
- **UI:** shadcn/ui + Aceternity UI + Magic UI + Recharts (dark-first theme)
- **Backend:** Python 3.12+, FastAPI, Pydantic v2, uvicorn
- **Database:** Supabase (managed PostgreSQL 16+ with pgvector), asyncpg driver
- **Auth:** Clerk (OAuth: LinkedIn, GitHub, Google), JWT verification via JWKS
- **LLM:** Claude API (Sonnet 4.6 for conversations, Haiku 4.5 for bulk) + Instructor for structured extraction
- **Hosting:** Vercel (frontend), Railway (backend), Supabase (database), Upstash (Redis, when needed)
- **Testing:** Vitest + Playwright (frontend), pytest + httpx (backend)
- **Monitoring:** Sentry (errors), PostHog (analytics)
- **CI/CD:** GitHub Actions
- **Package management:** pnpm (JS), uv (Python), Makefile (unified commands)

## Key Files

- `PRD.md` - Full product requirements document (855 lines)
- `docs/superpowers/specs/2026-04-11-monorepo-scaffold-design.md` - Monorepo scaffold design spec (approved)

## Monorepo Structure

```
entity/
├── apps/web/          # Next.js 15+ (the frontend)
├── packages/ui/       # Shared UI components (source package, @entity/ui)
├── backend/           # FastAPI Python service
├── supabase/          # Migrations, seeds, config
├── .github/workflows/ # CI/CD
├── docs/              # Specs, ADRs
└── Makefile           # Unified commands
```

## Architecture Decisions

- **Privacy-first:** founder data stays private on server, nothing shared without explicit action
- **Chat-first UX:** the AI mentor IS the product, dashboard is secondary
- **Rules-based scoring V1** — transparent, explainable, tier-based (not raw 0-100)
- **Single FastAPI service** for core API + scoring + LLM orchestration
- **asyncpg only** — no supabase-py in backend (single DB client, single connection pool)
- **RLS from day one** on all tables
- **UUIDv7** primary keys (time-ordered, no index fragmentation)
- **Normalized conversation storage** — `mentor_messages` table, not JSONB
- **pgvector embedding** on `startup_profiles` for semantic search
- **TanStack Query** for server state (no Zustand initially)
- **Redis deferred** — PostgreSQL handles session state at Phase 1 scale
- **Browser extension cut** from Phase 1

## Phase 1 Scope

**IN:** AI mentor conversations, signal extraction, scoring engine, founder dashboard, OAuth login
**OUT:** Browser extension, investor marketplace, ML scoring, payments, Redis

## Development Conventions

- Follow global CLAUDE.md for TDD, immutability, TypeScript strict mode
- Python: PEP 8, type hints, Pydantic v2, ruff + pyright strict
- TypeScript: strict mode, no `any`, Zod for validation, path aliases `@/`
- Tailwind 4: CSS-first config with `@theme` blocks, `@source` for packages/ui
- All LLM calls through centralized orchestration layer (Anthropic SDK + Instructor)
- Clerk webhook verification via svix
- FastAPI CORS middleware + Next.js API route proxy pattern

## Design Tooling (for Claude)

When building frontend components, follow this pipeline in order:

1. **`ui-ux-pro-max` skill** — design system decisions (colors, typography, spacing, UX patterns)
2. **Aceternity UI MCP** (`aceternity-mcp`) — search 106+ dramatic components (Spotlight, Aurora, Multi Step Loader, Sidebar, Card effects)
3. **`21st.dev` MCP builder** — search for premium component patterns and snippets
4. **shadcn/ui MCP** (`shadcn mcp`) — install primitives conversationally (Field, Input, Chart, Sonner, etc.)
5. **`mcp-universal-icons`** — 60k+ SVG icons (Lucide, Phosphor, Material, Heroicons) with JSX + Tailwind output
6. **Build in `packages/ui/`** — compose components with Motion (framer-motion) animations
7. **`21st.dev` MCP refiner** — polish transitions, hover states, micro-interactions
8. **`21st.dev` logo search** — SVG/TSX company logos (LinkedIn, GitHub, Google for OAuth)
9. **Playwright** — screenshot every screen, verify visually, catch regressions

### Installed Design Packages (`@entity/web`)

- `motion` v12 (formerly framer-motion) — animation engine, OKLCH-native, used by Aceternity + Magic UI
- `@phosphor-icons/react` — 9k+ icons, 6 weights, duotone for dark themes
- `recharts` — radar charts, radial gauges, trend lines (shadcn charts built on this)
- `sonner` — toast notifications (shadcn recommended)
- `vaul` — drawer/bottom-sheet component

### Component Sources by Need

- **Backgrounds/effects**: Aceternity (Aurora, Beams, Spotlight, Vortex)
- **App-level polish**: Magic UI (Shimmer Button, Border Beam, Blur Fade, Number Ticker)
- **Form primitives**: shadcn/ui (Field, Input, Select, Label)
- **Charts/gauges**: shadcn Recharts (Radar, Radial with endAngle, Area)
- **Icons**: Lucide (app UI) + Phosphor duotone (feature icons)
- **Animations**: Motion v12 (page transitions, hover effects, entrance animations)

### MCP Servers (`.mcp.json`)

- `shadcn` — shadcn/ui component installation
- `aceternity` — Aceternity UI component discovery
- `universal-icons` — multi-library icon search
- `magic` (via plugin) — 21st.dev component builder/refiner/logo search
- `playwright` (via plugin) — browser automation and screenshots
