.PHONY: setup dev dev\:web dev\:api dev\:db test test\:web test\:api test\:e2e lint format typecheck db\:migrate db\:reset db\:seed db\:diff ci

# ──────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────

setup:
	@echo "Installing pnpm dependencies..."
	pnpm install
	@echo "Installing Python dependencies..."
	cd backend && uv sync
	@echo "Initializing Supabase..."
	supabase start || true
	@echo "Creating .env from template..."
	@[ -f .env ] || cp .env.example .env
	@echo "Setup complete! Run 'make dev' to start all services."

# ──────────────────────────────────────────────
# Development
# ──────────────────────────────────────────────

dev:
	npx concurrently \
		--names "web,api,db" \
		--prefix-colors "blue,green,yellow" \
		"pnpm --filter @entity/web dev" \
		"cd backend && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000" \
		"supabase start"

dev\:web:
	pnpm --filter @entity/web dev

dev\:api:
	cd backend && uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

dev\:db:
	supabase start

# ──────────────────────────────────────────────
# Testing
# ──────────────────────────────────────────────

test: test\:web test\:api

test\:web:
	pnpm --filter @entity/web test

test\:api:
	cd backend && uv run pytest -v

test\:e2e:
	pnpm --filter @entity/web exec playwright test

# ──────────────────────────────────────────────
# Code Quality
# ──────────────────────────────────────────────

lint:
	pnpm --filter @entity/web lint
	cd backend && uv run ruff check .

format:
	cd backend && uv run ruff format .

typecheck:
	pnpm --filter @entity/web exec tsc --noEmit
	cd backend && uv run pyright

# ──────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────

db\:migrate:
	supabase db push

db\:reset:
	supabase db reset

db\:seed:
	supabase db reset

db\:diff:
	supabase db diff

# ──────────────────────────────────────────────
# CI (mirrors GitHub Actions)
# ──────────────────────────────────────────────

ci: lint typecheck test
