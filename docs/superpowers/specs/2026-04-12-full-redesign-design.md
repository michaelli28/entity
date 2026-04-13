# ZStar Full Redesign — Editorial Design Language

**Date:** 2026-04-12
**Status:** Approved (brainstorming phase)
**Scope:** Complete visual redesign of all ~20 application surfaces using an editorial, dark, gradient-accented design language derived from `concept.html`. Backend behavior and data contracts are untouched.

---

## 1. Goal

Replace the current generic product UI with a distinctive, production-ready editorial design language across marketing, auth, onboarding, dashboard, chat, scores, profile, settings, and presentational surfaces. Concept.html is directional (mood, palette, type, motion) — not a literal port. The redesign must land evenly across every surface; no page left un-redesigned.

Backend integrations (Clerk auth, FastAPI + asyncpg, Claude mentor chat with rehydration, scoring engine, deck upload with Vision extraction, GitHub enrichment) must continue working unchanged.

---

## 2. Approach

**Tokens-first, surface-by-surface.** Ship in this order:

1. Establish design tokens in `packages/ui/src/styles/tokens.css` (Tailwind 4 `@theme`).
2. Build primitive components in `packages/ui` (editorial primitives + shell components).
3. Rebuild app shell (marketing NavPill; dashboard hybrid Sidebar).
4. Redesign surfaces in route-group order, composing primitives.
5. Playwright screenshot every surface at 1440w and 375w; archive to `docs/screenshots/redesign/`.

Rejected alternatives: *Surface-by-surface then extract* (high inconsistency risk, duplicate work); *Nuke and rebuild* (unacceptable regression risk for chat rehydration, scoring, Clerk wiring).

---

## 3. Design Tokens

Location: `packages/ui/src/styles/tokens.css`. Imported by `apps/web/src/app/globals.css`.

### 3.1 Color

| Token | Value |
|---|---|
| `--color-bg` | `#000` |
| `--color-text` | `#f4f2ff` |
| `--color-muted` | `rgba(244,242,255,.42)` |
| `--color-border` | `rgba(255,255,255,.07)` |
| `--color-border-strong` | `rgba(255,255,255,.1)` |
| `--color-brand-purple` | `#7c3aed` |
| `--color-brand-indigo` | `#4f46e5` |
| `--color-brand-blue` | `#2563eb` |
| `--color-brand-purple-light` | `#a78bfa` |
| `--color-brand-indigo-light` | `#818cf8` |
| `--color-brand-blue-light` | `#60a5fa` |
| `--gradient-brand` | `linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)` |
| `--gradient-flow` | `linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa, #7c3aed)` (animated) |

No light mode in scope. Dark-only.

### 3.2 Typography

Google Fonts loaded via `next/font` in `apps/web/src/app/layout.tsx`:
- `DM Serif Display` (regular + italic) — `font-display`
- `Syne` (300–800) — `font-sans`, default
- `JetBrains Mono` (300, 400) — `font-mono`

Scale:
- Display H1: `clamp(52px, 6.5vw, 100px)`, line-height 0.95, letter-spacing -3px
- Display H2: `clamp(36px, 4vw, 60px)`, line-height 1.0, letter-spacing -1.5px
- Body: 13–17px Syne
- Mono label: 10–12px with 0.06–0.14em letter-spacing, often uppercase

### 3.3 Motion

- `--motion-gradient-shift`: 4–5s ease infinite (applied to gradient-clipped text and accent bars)
- Page transitions: 200ms ease (Motion v12)
- Hover color: 200ms; hover fill/underline: 400ms cubic-bezier(.4,0,.2,1)
- Custom cursor: 8px dot, `mix-blend-mode: screen`
- `prefers-reduced-motion` disables gradient animation and custom cursor

### 3.4 Borders and spacing

- Default border is hairline (1px, `--color-border`)
- Sharp corners by default; pills (nav, chips, CTAs) and avatars (gradient circle) are the only rounded elements
- Section padding: 80–120px vertical on marketing; 40–60px on dashboard
- Grid gap on card grids: 1px (to create continuous hairline grid)

---

## 4. Component Library

Location: `packages/ui/src/`. Exported via `@zstar/ui`. Existing `components/button.tsx`, `aceternity/aurora-background.tsx`, `magic/shimmer-button.tsx` remain.

### 4.1 Layout primitives

- `NavPill` — floating pill nav: animated gradient logo, link list (tabs), CTA button. Used by marketing/public shell.
- `Sidebar` — hybrid editorial sidebar: 240px, hairline right border, serif wordmark top, mono nav labels, gradient accent on active item, collapses to NavPill below `lg`. Used by dashboard shell.
- `Shell` — route-group-aware wrapper that picks NavPill vs Sidebar vs minimal shell.
- `CustomCursor` — global 8px screen-blended cursor; respects reduced-motion.

### 4.2 Typographic primitives

- `Display` — DM Serif Display heading; `<em>` children auto-render with `--gradient-flow` clip + animation.
- `Eyebrow` — uppercase mono label with leading 24×1px gradient bar + gradient text.
- `MonoCaption` — mono text for numbers, timestamps, status metadata.
- `Ticker` — horizontal marquee of mono entries separated by gradient `—` glyphs.

### 4.3 Surface primitives

- `HairlineCard` — black surface, hairline border, optional bottom hover-underline that fills on hover.
- `StatCard` — mono label + serif numeric value (optionally gradient-clipped) + animated gradient fill bar driven by CSS custom property `--w`.
- `Chip` — mono text, hairline border, purple hover border + text.
- `GradientAccent` — reusable gradient-text wrapper.
- `DotPulse` — 7px pulsing dot for "live/listening" status.
- `HeroBackdrop` — aurora/beam wrapper (composes existing `aurora-background`).

### 4.4 Domain compositions

Live in `apps/web/src/components/` (not in `packages/ui` — they bind to domain state).

- `MentorChatCard` — editorial chat UI: serif avatar with animated gradient ring, mono status, hairline message bubbles, gradient send button, coverage progress bar at top.
- `ScoreRadarFrame` — editorial frame around existing Recharts radar; preserves current data contract.
- `SessionRow` — list row: mono timestamp + session #, serif title, progress bar, status chip.
- `DeckUploadEditorial` — editorial skin over the existing `DeckUploader` component; preserves polling and Vision-extraction display.

---

## 5. App Shell

Three shells, selected by Next.js route group.

### 5.1 Marketing shell — `(marketing)`, `(public)`

- `NavPill` fixed top-center, 32px from top
- Links: Product, Pricing, For Investors, Docs, Sign in
- Pill CTA right side: "Start your profile" with gradient dot
- Footer: hairline top border, mono section headers, serif wordmark, legal strip with `—` separators
- `CustomCursor` enabled

### 5.2 Dashboard shell — `(dashboard)`

- `Sidebar` fixed left, 240px, hairline right border
  - Serif italic wordmark top-left with animated gradient
  - Mono eyebrow `WORKSPACE` above nav list
  - Nav: Dashboard, Sessions, Scores, Profile, Settings — mono 11px uppercase; active item gets 2px gradient left border and full-opacity text (Deck lives inside Profile, not a top-level nav item)
  - Bottom: gradient-circle avatar with serif initial, name, sign-out icon
- Top bar in page area: mono breadcrumb (e.g. `home / sessions / deep-dive 03`) left; session status pill right; page-specific action far right
- Main content: full-bleed with hairline section dividers, generous vertical rhythm
- `CustomCursor` enabled
- Below `lg`: sidebar collapses to top `NavPill`; breadcrumbs persist

### 5.3 Auth / onboarding shell — `(auth)`, `(onboarding)`

- No nav chrome; centered card on `HeroBackdrop` aurora
- Serif display title; mono step indicator (`01 / 04`); gradient CTA
- Clerk components restyled via Clerk `appearance` config to match (hairline inputs, gradient submit, mono labels)
- `CustomCursor` enabled

### 5.4 Presentational shell — `/cold-read/[slug]`, `/invite/[token]`

- Minimal: wordmark top-left, no nav, full-bleed editorial treatment
- Presentation-grade, shareable

---

## 6. Per-Surface Inventory

### 6.1 Marketing / public

- **`/` landing** — hero with `Display` + `<em>` gradient headline, animated `Ticker` of stats, 3-column `HairlineCard` grid ("What it does"), clients strip, long editorial feature sections (eyebrow + serif + mono captions), footer.
- **`/privacy`, `/terms`, `/subprocessors`** — long-form editorial: serif H1, mono section numbers, hairline dividers between clauses, monospace code blocks for data types.

### 6.2 Auth

- **`/sign-in`, `/sign-up`** — `HeroBackdrop` aurora, centered black card with hairline border, serif display title ("Welcome *back*"), Clerk form restyled.

### 6.3 Onboarding

- **`/onboarding`** — editorial intro card, mono `01 / 04` step indicator, serif prompt.
- **`/onboarding/profile`** — multi-step form with hairline field dividers, eyebrow labels, gradient submit.
- **`/onboarding/ready`** — celebration screen: large serif "*Ready.*", ticker of what happens next, gradient CTA to dashboard.

### 6.4 Dashboard

- **`/dashboard`** — editorial overview: serif greeting with name in gradient italic, `StatCard` grid (sessions count, last score, streak), recent activity list using `SessionRow`, quick actions as `Chip` row.
- **`/dashboard/sessions`** — session list as editorial rows.
- **`/dashboard/chat`, `/dashboard/chat/[sessionType]`, `/dashboard/chat/deep-dive/[sessionId]`** — full-bleed `MentorChatCard`; deep-dive adds right-rail mono metadata panel (topic, turns, coverage %, time).
- **`/dashboard/scores`** — `ScoreRadarFrame` around existing Recharts radar; `StatCard` grid below with serif numeric values and animated gradient fill bars per signal.
- **`/dashboard/profile`** — GitHub/LinkedIn/website cards (hairline, mono labels, gradient accent bars); `DeckUploadEditorial` section.
- **`/dashboard/settings`** — long-form editorial settings: eyebrow section labels, hairline field dividers, toggles with gradient active state.
- **`/dashboard/artifacts/[id]`** — presentation-grade artifact view: serif title, mono timestamp, full-bleed editorial content.

### 6.5 Presentational

- **`/cold-read/[slug]`** — pitch-ready editorial layout: serif founder name, animated gradient deck sections, mono metadata, hairline dividers.
- **`/invite/[token]`** — minimal acceptance flow on aurora backdrop.

---

## 7. Testing and Verification

- **Type-checking**: `pnpm -w typecheck` must stay clean after every primitive addition.
- **Unit tests**: primitives (NavPill, Sidebar, Display, Eyebrow, StatCard, Chip, HairlineCard) get Vitest unit tests under `packages/ui/src/__tests__/`. Test rendering, variant props, reduced-motion fallback.
- **Integration**: rehydration, scoring fetch, deck upload polling, GitHub enrichment must pass their existing tests unchanged (redesign is presentation-only).
- **Visual verification**: Playwright script screenshots every route at 1440w and 375w. Artifacts committed to `docs/screenshots/redesign/` for before/after review. Run before each PR.
- **Accessibility**: all interactive elements keyboard-reachable; focus ring uses gradient outline (2px offset); custom cursor does not replace focus states; `prefers-reduced-motion` disables animated gradients and cursor.
- **Performance**: Google Fonts loaded via `next/font` with `display: swap`; no FOIT. Gradient animations use `background-position` (cheap, GPU-compositable).

---

## 8. Out of Scope

- Light mode
- Content rewrites beyond what's required for new layouts (copy tone adjustments happen as part of each surface redesign, not as a separate pass)
- New features or data model changes
- Phase 2 investor surfaces (will inherit the system for free once shipped)
- Mobile-native apps (responsive web only, `<lg` collapses to NavPill)

---

## 9. Risks

- **Font load weight**: three Google Fonts. Mitigation: use `next/font` with subset + `display: swap`; monitor Lighthouse performance.
- **Custom cursor + accessibility**: aggressive UX pattern. Mitigation: hard-gate on `prefers-reduced-motion`; preserve native focus states; provide a settings toggle if users request.
- **Gradient animation cost**: many animated gradients across one page. Mitigation: animate `background-position` only; cap concurrent animated elements per page to ~8.
- **Clerk styling ceiling**: Clerk `appearance` config may not reach every internal element. Mitigation: accept minor residual Clerk chrome; if blocking, switch to Clerk `<SignIn.Root>` headless primitives.
- **Regression on working flows**: rehydration, scoring, deck upload all currently work. Mitigation: redesign is presentation-only; preserve all data hooks, URLs, and component prop contracts.

---

## 10. Success Criteria

- Every one of the ~20 surfaces redesigned using the editorial language.
- All existing tests pass unchanged.
- Playwright screenshot set captured at 1440w and 375w for every route.
- Design tokens centralized in `packages/ui`; no ad-hoc colors or font families in `apps/web`.
- Primitive components reused across ≥3 surfaces each (validates the "tokens-first" bet).
