# Auth Surfaces Design — Sign-in / Sign-up

**Status:** Approved (brainstorm stage)
**Date:** 2026-04-13
**Scope:** `apps/web/src/app/(auth)/**`

## Goal

Replace the near-default Clerk sign-in / sign-up screens with a quiet, on-brand split layout that matches the marketing landing page's palette and typography without competing with it for attention. Auth's job is to feel trustworthy and let the user type.

## Non-goals

- No WebGL / Three.js in the auth shell. The marketing icosahedron stays on the landing page.
- No rotating testimonials, animated word rotators, or signal mockups on the left panel. V1 is brand + tagline only.
- No changes to Clerk configuration (allowed identifiers, OAuth providers, webhooks, redirect URLs). Only presentational wrapping and `appearance` theming.
- No changes to `/onboarding`, `/dashboard`, or marketing routes.

## Layout

### Desktop (≥ 1024px)

A 50/50 full-viewport split using CSS grid (`grid-template-columns: 1fr 1fr`).

**Left panel — `mkt-auth-brand`**

- Dark surface, reuses the marketing gradient base (same OKLCH tokens as `(marketing)/marketing.css`), no WebGL layer.
- Subtle grain layer at low opacity (same pattern as marketing grain).
- Three stacked regions (flex column, `justify-content: space-between`, `padding: 2.5rem`):
  1. **Top:** ZStar wordmark, ≤ 32px, same font as marketing header.
  2. **Middle (vertically centered within its row):** Tagline — *"Turn your hustle into investor signal."* Same heading font as the marketing hero, tight tracking, size clamp around 40–48px.
  3. **Bottom:** Muted footer row — `© 2026` · `Privacy` · `Terms`. Links point to existing `(public)/privacy` and `(public)/terms` routes.

**Right panel — `mkt-auth-form`**

- Neutral dark surface, one step lighter than the left so the seam is visible without a hard border.
- Centered column, `max-width: 400px`, vertically centered.
- Contents (top → bottom):
  1. `<h1>` — "Welcome back" (sign-in) or "Create your account" (sign-up).
  2. Subtitle (single line):
     - Sign-in: "Pick up where you left off."
     - Sign-up: "Start your first mentor session in under a minute."
  3. Clerk `<SignIn />` or `<SignUp />` themed to match (see Theming).
  4. Cross-link below the Clerk card:
     - Sign-in: "Don't have an account? [Sign up](/sign-up)"
     - Sign-up: "Already have an account? [Sign in](/sign-in)"

### Mobile (< 1024px)

Split collapses to a single column:

- Left panel becomes a short top strip: wordmark + tagline (reduced to ~24px), no footer row.
- Form section below.
- Footer links (`Privacy`, `Terms`, `© 2026`) move to the bottom of the page.

## Clerk theming

Shared `appearance` object exported from `apps/web/src/lib/clerk/appearance.ts` and imported by both pages. It configures:

- `baseTheme: dark` (use Clerk's built-in dark theme as the starting point, then override).
- `variables` — map to our OKLCH tokens: `colorBackground`, `colorText`, `colorPrimary`, `colorInputBackground`, `colorInputText`, `colorTextSecondary`, `borderRadius`, `fontFamily`.
- `layout.socialButtonsPlacement: "top"` — OAuth above email.
- `layout.socialButtonsVariant: "blockButton"` — full-width social buttons.
- `elements` — scoped overrides for `card`, `headerTitle`, `headerSubtitle`, `socialButtonsBlockButton`, `formFieldInput`, `formButtonPrimary`, `footer` so the Clerk widget matches our surface colors and border radius. The Clerk-rendered header is hidden (`display: none`) because our own `<h1>` + subtitle sit above it.
- OAuth order: LinkedIn, GitHub, Google (ordering is controlled in the Clerk dashboard; this spec assumes that order; no code change needed if it differs).

## File changes

| Path | Action | Purpose |
|---|---|---|
| `apps/web/src/app/(auth)/layout.tsx` | Replace | Full split shell with left brand panel and right form slot; keeps `TheatricsProvider value="medium"`. |
| `apps/web/src/app/(auth)/auth.css` | Create | Scoped styles for `.mkt-auth-shell`, `.mkt-auth-brand`, `.mkt-auth-form`, responsive breakpoint, grain layer. Mirrors the `marketing.css` pattern. |
| `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Replace | Heading, subtitle, themed `<SignIn />`, cross-link. |
| `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Replace | Heading, subtitle, themed `<SignUp />`, cross-link. |
| `apps/web/src/lib/clerk/appearance.ts` | Create | Shared `appearance` object for both Clerk components. |

No changes to `packages/ui/` (auth chrome is app-scoped, not shared).

## Verification

1. **Type-check:** `pnpm --filter @zstar/web typecheck` passes.
2. **Playwright visuals:** screenshot `/sign-in` and `/sign-up` at 1440×900, 768×1024, and 390×844. Confirm palette/typography continuity with marketing page.
3. **Functional smoke test (manual):** sign-in form renders OAuth buttons in order (LinkedIn, GitHub, Google), email field present, tab order is logical, cross-link navigates, footer links navigate to `/privacy` and `/terms`.
4. **Regression check:** marketing page and dashboard unchanged (spot check one screenshot each).

## Open questions

None at this stage. Clerk `appearance` mapping will be finalized during implementation against the live Clerk component DOM.
