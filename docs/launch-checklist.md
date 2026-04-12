# Launch Prep Checklist

Status as of 2026-04-12. `[x]` = done by this branch, `[ ]` = manual / post-merge.

## In code (landed on feat/mvp-2day)

- [x] Privacy policy, terms, sub-processors pages at `/privacy`, `/terms`, `/subprocessors` (T46)
- [x] DPA register + Anthropic ZDR request template in `docs/compliance/` (T47)
- [x] Clerk invite-only sign-up UI messaging (T48)
- [x] Sentry client/server/edge configs + backend init (T07, T21)
- [x] Founder patterns (55) + stage benchmarks (20) seeded via `uv run python scripts/load_seeds.py` (T44)
- [x] 20 golden behavioral eval YAMLs + runner (T45)
- [x] Data export endpoint `/api/founders/me/export` (T40)
- [x] 30-day hard-delete scheduled job (T39)
- [x] Re-engagement + welcome email jobs via APScheduler (T37, T38, T39)
- [x] Tenant-isolation CI lint (T13)
- [x] PostHog dashboard spec in `docs/observability.md` (T50)

## Manual / operator tasks (before first design partner signup)

- [ ] All 8 DPAs signed (Clerk, Anthropic, Supabase, Vercel, Railway, Sentry, PostHog, Resend) — see `docs/compliance/dpa-register.md`
- [ ] Anthropic ZDR confirmed in writing
- [ ] Clerk dashboard: User & Authentication → Restrictions → Restricted mode: **Enabled**
- [ ] Clerk dashboard: create invitation links for 30 design partners
- [ ] Clerk dashboard: JWT template "backend" includes `email`, `name`, `image_url` custom claims (required by backend `verify_clerk_jwt` + `checkOnboarded`)
- [ ] Supabase prod project: apply `supabase/migrations/*` via CLI or dashboard
- [ ] Seed prod DB: `DATABASE_URL=<prod> uv run python scripts/load_seeds.py`
- [ ] Sentry project: set `NEXT_PUBLIC_SENTRY_DSN` (frontend) and `SENTRY_DSN` (backend) env vars
- [ ] PostHog project: set `NEXT_PUBLIC_POSTHOG_KEY` (frontend) and `POSTHOG_API_KEY` (backend) env vars; create 5 dashboards from `docs/observability.md`
- [ ] Resend project: verify sending domain; set `RESEND_API_KEY` env var
- [ ] Run evals: `ANTHROPIC_API_KEY=... uv run python evals/run_evals.py` — confirm ≥ 16/20 pass required traits
- [ ] 100-target design partner outreach list written (founders at pre-seed/seed with fundraising-prep ask)
- [ ] Waitlist page live (collects email to `waitlist` table — not in this plan, post-merge)
- [ ] 30 design partners contacted with invite links

## Pre-launch go/no-go gates

- [ ] Signed DPAs from all 8 sub-processors
- [ ] Anthropic ZDR confirmed
- [ ] Eval pass rate ≥ 80%
- [ ] E2E golden path passes in CI (requires Clerk test mode)
- [ ] Backend deployed to Railway, frontend to Vercel
- [ ] Prod Supabase migrations applied + seeded
- [ ] Smoke test end-to-end with a real invite → signup → onboarding → 3-turn chat → Cold Read → welcome email

## Known gaps / post-launch follow-ups

- Signal scoring engine (Phase 1 deferred — stubbed schema only)
- Browser extension (cut from Phase 1)
- Investor marketplace (Phase 2)
- Waitlist table + collector page
- Payments / billing (deferred)
- Clerk JWT template "backend" manual config (Clerk does not expose a programmatic API)
- Replay Cold Reads older than 30 days on return (nice-to-have retention feature)
