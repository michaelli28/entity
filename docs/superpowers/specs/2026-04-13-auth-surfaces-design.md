# Auth Surfaces Design — Sign-in / Sign-up

**Status:** Approved (brainstorm stage, revised against `.impeccable.md`)
**Date:** 2026-04-13
**Scope:** `apps/web/src/app/(auth)/**`

## Goal

Replace the near-default Clerk screens with an editorial-technical auth shell that matches ZStar's sharp/sleek/dynamic brand. The form is primary; the left stage is a quiet moment of voice. The founder should feel *clarity about to happen*, not marketing.

## Design point-of-view

**Lineage:** Linear's token discipline · Dedalus's atmospheric dark · Formless's italic-display-breaking-into-sans.

- **Asymmetric, form-weighted** (38 / 62) — not the default 50/50. The form earns more real estate because it is the job.
- **One 1px hairline** separates the panels. Both sides share the same `--bg`; the seam is the only divider. No gradient backgrounds, no surface-lightness split, no glass.
- **One display moment.** A single Bodoni Moda italic line on the left — *"Clarity, / then the next move."* — is the only expressive typography on the page. Everything else is Geist Sans / Geist Mono.
- **One accent word.** `Clarity,` renders in `--accent` violet. One word. The rest in `--text`. No gradient fill.
- **Editorial eyebrows.** Tiny Geist Mono uppercase-tracked tags — `[ ACCESS ]` on the left, `[ RETURN ]` / `[ BEGIN ]` on the right — mark sections the way a magazine caption does, not the way a dashboard does.
- **One earned motion.** Staggered entrance on mount only, 180ms, `ease-out-quart`. No hover loops, no scroll effects, no AI-orb.

## Layout

### Desktop (≥ 900px)

CSS grid with an explicit 1px hairline column:

```
grid-template-columns: minmax(0, 38fr) 1px minmax(0, 62fr);
min-height: 100dvh;
background: var(--bg);
```

The middle column is a `<div aria-hidden>` with `background: var(--border)` — a single pixel of hairline, full height.

#### Left stage — `mkt-auth-stage` (38%)

Flat `--bg`, padding `clamp(2rem, 4vw, 3.5rem)`. Flex column, `justify-content: space-between`. Three regions:

1. **Top block (top-anchored):**
   - Eyebrow: `[ ACCESS ]` — Geist Mono, 11px, `--text-dim`, `letter-spacing: 0.18em`, uppercase.
   - Wordmark: `ZStar` — Geist Sans 500, 20px, `--text`. Anchor only; not centered.

2. **Display quote (offset ~45% from top, not centered):**
   - Line 1: `Clarity,` — Bodoni Moda italic, `clamp(44px, 5vw, 64px)`, `--accent`, line-height 0.95.
   - Line 2: `then the next move.` — Bodoni Moda italic, `clamp(28px, 3vw, 38px)`, `--text`, line-height 1.1.
   - No period on line 1 (it has the comma). The full line reads as one breath broken across two sizes.
   - `max-width: 22ch` so the line break feels intentional, not responsive-collapse.

3. **Bottom block (bottom-anchored):**
   - Time-of-day micro-copy: a single line in Bodoni Moda italic 14px `--text-dim`, e.g. `"Late-night session."` / `"Early-morning session."` / `"Afternoon session."` / `"Evening session."`. Client-computed from `new Date().getHours()`; renders blank on SSR, fades in after hydration (no mismatch).
   - Legal row: `© 2026 ZSTAR · PRIVACY · TERMS` — Geist Mono 11px, `--text-dim`, uppercase, `letter-spacing: 0.18em`. Separators are middle-dots (`·`), not pipes. Links to `/privacy` and `/terms`.

#### Right panel — `mkt-auth-form` (62%)

Flat `--bg`, vertical flex, content centered horizontally, top-weighted (~38% from top so it reads before scrolling). Column width `max-width: 380px`.

1. Eyebrow: `[ RETURN ]` (sign-in) or `[ BEGIN ]` (sign-up) — Geist Mono, 11px, `--text-dim`, tracked uppercase.
2. Heading (`<h1>`): `Welcome back.` (sign-in) or `Let's begin.` (sign-up) — Geist Sans 550, 30px, `--text`, trailing period, `letter-spacing: -0.01em`.
3. Subtitle: `Pick up the thread.` (sign-in) or `Your first session takes a minute.` (sign-up) — Geist Sans 400, 15px, `--text-muted`.
4. Gap: 32px.
5. Clerk `<SignIn />` / `<SignUp />` — themed (see Theming).
6. Gap: 20px.
7. Cross-link: `New here? Begin.` / `Already in? Return.` — Geist Sans 14px, `--text-muted`; the second word is `<Link>` in `--accent` with underline on hover only.

### Mobile (< 900px)

Single column, form first, stage second. No hairline.

- Top strip (reduced stage): eyebrow + wordmark + time-of-day micro-copy (display quote is **hidden on mobile** — it's a luxury, not a requirement, and the form is the point).
- Form block: eyebrow, heading, subtitle, Clerk component, cross-link.
- Footer: legal row at the bottom of the page.
- Horizontal padding: `clamp(1.25rem, 5vw, 2rem)` throughout.

## Typography (page-wide)

- Display: Bodoni Moda italic — *only* the two-line quote and the time-of-day micro-copy. Nowhere else.
- Headings, body, Clerk form: Geist Sans.
- Eyebrows, legal, Clerk button labels where appropriate: Geist Mono uppercase, tracked 0.18em.
- No all-caps body. No gradient fill anywhere.

## Motion (one earned arrival)

On mount only. No loops, no hover animations beyond native color transitions, no scroll-linked effects.

- Left stage, staggered 40ms per child (eyebrow, wordmark, display quote, micro-copy, legal): `opacity: 0 → 1`, `translateY: 4px → 0`, 180ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart).
- Right panel block fades in together at 120ms delay, same easing.
- `@media (prefers-reduced-motion: reduce)`: translate removed, durations halved, no stagger (all fade together).

## Clerk theming (`appearance` module)

Shared `appearance` exported from `apps/web/src/lib/clerk/appearance.ts`. Goals: Clerk should feel like our page, not like a Clerk widget on our page.

- `baseTheme: dark`.
- `variables`: map to our OKLCH tokens — `colorBackground: var(--bg)`, `colorText: var(--text)`, `colorTextSecondary: var(--text-muted)`, `colorInputBackground: var(--bg-elevated)`, `colorInputText: var(--text)`, `colorPrimary: var(--text)`, `colorDanger: var(--signal-neg)`, `borderRadius: 4px`, `fontFamily: var(--font-sans)`.
- `layout.socialButtonsPlacement: "top"`, `layout.socialButtonsVariant: "blockButton"`, `layout.showOptionalFields: false`.
- `elements` (scoped overrides):
  - `rootBox`: full-width, no card background, no shadow.
  - `card`: `background: transparent`, `box-shadow: none`, `padding: 0`, `border: none`.
  - `header`: `display: none` (we render our own `<h1>` + subtitle).
  - `footer`: `display: none` (we render our own cross-link).
  - `socialButtonsBlockButton`: `background: var(--bg-elevated)`, `border: 1px solid var(--border)`, `color: var(--text)`, hover `border-color: var(--border-strong)`, `color: var(--text)` (no fill change — restraint).
  - `socialButtonsBlockButtonText`: Geist Sans 500, 14px.
  - `dividerLine`: `background: var(--border)`, 1px.
  - `dividerText`: Geist Mono 11px uppercase tracked 0.18em, `--text-dim`, label "OR EMAIL".
  - `formFieldInput`: `background: var(--bg-elevated)`, `border: 1px solid var(--border)`, focus `border-color: var(--accent)`, `box-shadow: 0 0 0 2px var(--accent-glow)`.
  - `formFieldLabel`: Geist Mono 11px uppercase tracked 0.18em, `--text-muted`.
  - `formButtonPrimary`: `background: var(--text)`, `color: var(--bg)`, `border: none`, hover `background: var(--accent)`, `color: var(--bg)` — this is the ONE bright element on the page, which makes it unambiguous.
  - `formFieldAction__forgotPassword`, `identityPreviewEditButton`: `color: var(--accent)` on hover only; resting `--text-muted`.
- OAuth provider order (LinkedIn → GitHub → Google) is controlled in the Clerk dashboard; spec assumes that order. No code change if it differs.

## File changes

| Path | Action | Purpose |
|---|---|---|
| `apps/web/src/app/(auth)/layout.tsx` | Replace | Asymmetric grid shell (left stage + 1px hairline + right slot). Keeps `<TheatricsProvider value="medium">`. |
| `apps/web/src/app/(auth)/auth.css` | Create | Layout, hairline, responsive collapse, entrance animation, `prefers-reduced-motion` branch. Mirrors the `marketing.css` pattern. |
| `apps/web/src/app/(auth)/_components/brand-stage.tsx` | Create | Left panel content. Client component for time-of-day micro-copy (hydration-safe: empty on SSR, populated after mount). |
| `apps/web/src/app/(auth)/_components/auth-intro.tsx` | Create | Right panel heading block. Server component, `mode: "signin" \| "signup"` prop. |
| `apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Replace | `<AuthIntro mode="signin" />`, themed `<SignIn />`, cross-link. |
| `apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Replace | `<AuthIntro mode="signup" />`, themed `<SignUp />`, cross-link. |
| `apps/web/src/lib/clerk/appearance.ts` | Create | Shared Clerk `appearance` object used by both pages. |

No changes outside `(auth)` (fonts are already registered in `apps/web/src/app/layout.tsx` as `Bodoni_Moda`, `Geist`, `Geist_Mono` — verified).

## Verification

1. **Type-check:** `pnpm --filter @zstar/web typecheck` passes.
2. **Visual diff (Playwright screenshots):** `/sign-in` and `/sign-up` at 1440×900, 1024×768, 390×844. Confirm:
   - Display quote renders in Bodoni Moda italic with `Clarity,` in `--accent`.
   - Hairline divider is a single 1px line.
   - No surface-lightness split between panels.
   - Primary CTA is `--text` on `--bg` (inverted).
   - Eyebrows render in Geist Mono tracked uppercase.
3. **Motion audit:** entrance plays once on load, no loops. With `prefers-reduced-motion: reduce`, translates are suppressed.
4. **Functional smoke (manual):** OAuth buttons render in LinkedIn/GitHub/Google order, tab order flows eyebrow → heading → OAuth → email → CTA → cross-link, cross-link navigates, legal links navigate to `/privacy` and `/terms`.
5. **A11y:** focus rings visible at 2px `--accent` with 2px offset on all interactive elements. Body contrast ≥ 4.5:1 (verify `--text-muted` on `--bg` with a contrast checker — currently 0.72 L on 0.13 L, expected pass).
6. **Regression:** marketing page screenshot unchanged (no shared file touched outside of spec scope).

## Impeccable self-check

- [x] No 50/50 split (asymmetric 38/62).
- [x] No `border-left` / `border-right` > 1px as accent stripe.
- [x] No `background-clip: text` gradient fill.
- [x] No glassmorphism (no blur, no glass surfaces).
- [x] No purple-to-blue gradient anywhere.
- [x] No pulsing "AI is thinking" orb.
- [x] No icon-above-every-heading template.
- [x] Typography uses non-reflex fonts (Geist Sans, Geist Mono, Bodoni Moda — none on the banned list).
- [x] Neutrals tinted toward brand hue (violet chroma 0.01–0.025 in `--bg` family).
- [x] 60-30-10 respected: `--bg` surface 60%, `--text` / `--text-muted` text 30%, `--accent` violet ~10% (one word in display + CTA hover + focus ring).
- [x] One earned motion moment; no hover loops.
- [x] Dark theme is a deliberate derivation from "late-night laptop grinding" use context, not a default.
