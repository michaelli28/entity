# ZStar

AI-powered founder profiling and deal flow platform.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Docker (required by Supabase CLI)

## Setup

```bash
git clone <repo-url> && cd zstar
make setup
```

Copy `.env.example` to `.env` and fill in your API keys:

- [Clerk](https://clerk.com) — create an application, get publishable + secret keys
- [Anthropic](https://console.anthropic.com) — get API key

## Development

```bash
make dev          # Start all services (Next.js :3000, FastAPI :8000, Supabase Studio :54323)
make dev:web      # Frontend only
make dev:api      # Backend only
make dev:db       # Database only
```

## Testing

```bash
make test         # All tests
make test:web     # Frontend (Vitest)
make test:api     # Backend (pytest)
make test:e2e     # E2E (Playwright)
```

## Code Quality

```bash
make lint         # ESLint + Ruff
make format       # Prettier + Ruff format
make typecheck    # tsc + pyright
make ci           # Full CI pipeline (lint + typecheck + test)
```

## Database

```bash
make db:migrate   # Run pending migrations
make db:reset     # Reset and re-seed
make db:diff      # Auto-generate migration from changes
```

## Project Structure

```
zstar/
├── apps/web/          # Next.js 15+ frontend
├── packages/ui/       # Shared UI components (@zstar/ui)
├── backend/           # FastAPI Python backend
├── supabase/          # Database migrations and config
└── docs/              # Design specs and plans
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind 4, shadcn/ui
- **Backend:** FastAPI, Python 3.12, Pydantic v2
- **Database:** Supabase (PostgreSQL 16 + pgvector)
- **Auth:** Clerk (LinkedIn, GitHub, Google OAuth)
- **AI:** Claude API + Instructor
