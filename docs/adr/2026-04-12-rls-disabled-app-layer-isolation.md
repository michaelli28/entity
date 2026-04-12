# ADR: Disable RLS, use app-layer tenant isolation

Status: Accepted
Date: 2026-04-12

## Context

Supabase RLS policies reference `current_setting('request.jwt.claims')` which only
works when requests go through PostgREST. Our FastAPI backend connects via asyncpg
using a service-role connection string. The GUC is never set, so RLS policies
silently evaluate against NULL — either returning zero rows (if role has no
BYPASSRLS) or being bypassed (if it does). Either outcome is misleading.

## Decision

Disable RLS on all tables for Phase 1. Enforce tenant isolation at the repository
layer: every query touching founder-owned tables MUST include `WHERE founder_id = $1`
where `$1` is derived from the verified Clerk JWT.

A CI lint (`backend/tests/unit/test_tenant_filter_lint.py`) parses SQL strings in
the repositories using sqlglot and fails if any query against founder-owned tables
lacks a `founder_id` predicate.

## Consequences

- Simpler mental model: one isolation mechanism, enforced in one place.
- CI guarantees new queries can't forget the filter.
- Re-enabling RLS later requires setting `request.jwt.claims` per-connection via
  `set_config('request.jwt.claims', ..., true)` inside a transaction.

## Phase 1.5 plan

Re-enable RLS as defense-in-depth once we add per-request GUC setting in the
asyncpg connection helper.
