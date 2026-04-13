# Full Redesign — Phase 2: Shell, Kinetic Layer, State Primitives (revised)

**Status:** Revised 2026-04-12 after five-agent debate (architect, motion/FE, skeptic, QA/TDD, product/UX).
**Prior version:** superseded — see git history at `cda385e`.
**Goal:** Ship the editorial shell + enough motion/state primitives to unblock Phase 3 domain compositions, without over-engineering the tier system or building cursor/transition features before they have real surfaces to serve.

---

## What changed vs. the prior plan

| # | Change | Reason |
|---|--------|--------|
| 1 | **Tier system via React Context**, not `document.documentElement[data-theatrics]` + MutationObserver | Race conditions on route change; SSR flash; React strict-mode double-invoke; 20+ observers on busy pages |
| 2 | **Task 10 View Transitions → deferred to Phase 4** | `unstable_ViewTransition` unstable; no shared-element pairs exist yet (YAGNI) |
| 3 | **Task 7 CustomCursor → gated behind `NEXT_PUBLIC_CURSOR` flag; perf rewritten** | String-concat `translate3d` per `pointermove` defeats GPU; 7-gate matrix can't be exercised until Phase 5 |
| 4 | **Task 3 Ticker → cut** | Pure decoration; zero user value pre-PMF |
| 5 | **Task 4 HeroBackdrop → trimmed** (drop `vignette` prop) | YAGNI; sign-in inline is fine |
| 6 | **`tokens.css` split** into `tokens.css` + `motion.css` + `cursor.css` | File was ~800 lines before per-surface work; tokens ≠ keyframes |
| 7 | **`useTheatrics` moved to `apps/web/src/lib/`** | `packages/ui` must stay app-agnostic (investor app reuse in Phase 2+) |
| 8 | **NEW Task: State primitives** (`EmptyState`, `LoadingShimmer`, `ErrorPanel`) | Missing entirely from prior plan; first-run UX dead-on-arrival without them |
| 9 | **NEW Task: Mobile shell** (Vaul drawer, `dvh` composer) | Prior plan had mobile as `hidden lg:flex` only — not a design |
| 10 | **NEW Task: Chat kinetics** (streaming reveal, thinking state) | "Mentor IS the product" yet chat got least motion design |
| 11 | **NEW Task: Playwright visual + a11y suite** | Prior plan gate was `pnpm test` only; zero visual regression |
| 12 | **Reduced-motion enforced in `KineticHeadline` (both branches)** + `useReducedMotion` reused from Phase 1 | Prior plan only short-circuited `calm` tier |
| 13 | **Focus-visible rings + skip-link on shell** | A11y violation on dark backdrop-blur surfaces; Safari doesn't render gradient outlines |
| 14 | **IntersectionObserver fallback for `ScrollReveal`** in browsers lacking `animation-timeline: view()` | Firefox silent-no-op otherwise |
| 15 | **Verification gate = typecheck + lint + test + coverage≥80% + e2e** | Prior gate was just `pnpm test` |

---

## Architecture

### Tier system — the new pattern

```
apps/web/src/lib/theatrics/
├── tier-context.tsx          # TheatricsContext, TheatricsProvider, useTheatrics()
└── resolve-tier.ts           # pure fn: (pathname, userState?) => "full" | "medium" | "calm"
```

- **Root `layout.tsx`** resolves default tier from route group (server-side) and renders `<html data-theatrics={tier}>`. CSS selectors still work (`html[data-theatrics="calm"] .x`).
- **Route-group `layout.tsx`** wraps children in `<TheatricsProvider value={tier}>` — no `useEffect`, no DOM mutation.
- **`useTheatrics()`** reads context. Primitives call it; no MutationObserver.
- **User-state override** (Task 14): provider accepts `override?: Tier` so a first-time founder on `/dashboard` can see `medium` while a returning one sees `calm`.
- **Settings kill-switch** (future): one line to force `"calm"` globally.

**`packages/ui` stays app-agnostic.** Primitives either accept `tier` as a prop OR consume a renamed `useMotionTier()` hook that is re-exported by apps/web wrapping their context. The global DOM assumption is gone.

### CSS file split

```
packages/ui/src/styles/
├── tokens.css       # colors, typography, spacing, radii ONLY
├── motion.css       # @keyframes zstar-dot-pulse, zstar-scroll-reveal, etc.
└── cursor.css       # .zstar-cursor, html[data-theatrics="full"] * { cursor: none } etc.
```

Imported in order from `apps/web/src/app/globals.css`.

### Slot discipline (unchanged, universally praised)

- `SidebarShell` knows nothing about ZStar nav — `AppSidebar` wraps it in Phase 3.
- `MentorChatCard` redesign is **wrap-only**: Vitest contract test asserts `messages / streaming / endRef / hasHydratedRef` are untouched.

---

## Task list (revised)

Tasks are ordered; parallel-safe groups marked. Each task = RED test → GREEN impl → REFACTOR → commit.

### Group A — Foundations (sequential)

**Task A1. Split `tokens.css` into tokens/motion/cursor**
- Move keyframes out; update `globals.css` imports; verify showcase still renders.
- TDD: Vitest test asserts `tokens.css` contains zero `@keyframes`.
- Est: 15 min.

**Task A2. Tier system (Context + resolver)**
- `resolve-tier(pathname, user?)` → `"full" | "medium" | "calm"` pure fn.
- `TheatricsProvider` / `useMotionTier()` in `apps/web/src/lib/theatrics/`.
- Root `layout.tsx` sets `<html data-theatrics={tier}>` from headers/pathname (server).
- Route-group layouts wrap children in provider.
- TDD: unit tests on `resolve-tier`; RTL tests asserting context value matches `data-theatrics` on each route group.
- **DELETE:** any `MutationObserver`, any `useEffect` writing to `document.documentElement.dataset`.
- Est: 3–4 hrs.

### Group B — Core primitives (parallel after A)

**Task B1. `GradientAccent` — trimmed**
- Static variant only (drop animated). One span, one class.
- TDD: renders correct class; a11y role.
- Est: 30 min.

**Task B2. `DotPulse`**
- Keep as specced. Streaming indicator maps to a real product state.
- TDD: renders; respects `useReducedMotion()` (no animation, static dot).
- Est: 45 min.

**Task B3. `HeroBackdrop` — trimmed**
- Drop `vignette` prop entirely. Aurora + single gradient only.
- TDD: renders inside container; no console errors.
- Est: 1 hr.

**Task B4. `NavPill`**
- Build per prior spec **plus**: `focus-visible:outline-2 outline-offset-2 outline-[var(--color-brand-purple-light)]` (solid, not gradient — Safari).
- Active: 1px bottom border in brand gradient (visual distinction beyond color; WCAG 1.4.1).
- `aria-current="page"` on active link.
- TDD: RTL keyboard-nav test (Tab cycles links, Enter activates); `vitest-axe` zero violations.
- Est: 2 hrs.

**Task B5. `SidebarShell`** (slot-based, no ZStar domain knowledge)
- Slots: `header`, `nav`, `footer`. Accept `className`, `collapsed` prop.
- Skip-link (`<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>`) rendered at top.
- `role="navigation"`; focus trap optional (deferred until drawer variant).
- TDD: RTL renders slots; axe clean; skip-link appears on focus.
- Est: 2–3 hrs.

### Group C — Kinetic layer (parallel; all honor `useReducedMotion` from Phase 1)

**Task C1. `KineticHeadline` — reduced-motion correct**
- Import `useReducedMotion` from `@zstar/ui/hooks` (Phase 1 hook — do NOT add a second one).
- Fall back to plain `<Display>` when `reducedMotion === true` **OR** `tier === "calm"`.
- TDD: mock `motion` module; assert variants passed when motion allowed; assert static render otherwise.
- Est: 2 hrs.

**Task C2. `ScrollReveal` with IntersectionObserver fallback**
- Feature-detect `CSS.supports("animation-timeline", "view()")`.
- If supported: CSS-driven reveal (current plan).
- If not: Motion v12 `whileInView` fallback.
- TDD: jsdom IntersectionObserver shim; assert element becomes visible on intersect.
- Est: 2 hrs.

**Task C3. `CustomCursor` — gated + perf-correct**
- **Flag:** `NEXT_PUBLIC_CURSOR` env var; default `0`. Wrap render in `if (!flag) return null`.
- **Perf:** use CSS vars `--cursor-x`, `--cursor-y` set via `element.style.setProperty`; static CSS does `translate: var(--cursor-x) var(--cursor-y); transform: translate(-50%,-50%)`. No string concat per frame.
- **rAF coalescing:** batch `pointermove` updates via `requestAnimationFrame`.
- 7-gate matrix (pointer:fine, reduced-motion, Clerk portals, iframes, `data-no-cursor`, inputs, contenteditable) — keep jsdom unit tests for gates.
- **Not enabled on any route yet** — Phase 5 turns it on after Playwright gating suite exists.
- Est: 3 hrs.

### Group D — State primitives (new, parallel with C)

**Task D1. `EmptyState`**
- Props: `eyebrow`, `title`, `body`, `action?`. Editorial treatment.
- Used by: empty mentor thread, empty dashboard pre-scoring, empty session history.
- TDD: RTL renders all slots; axe clean.
- Est: 1 hr.

**Task D2. `LoadingShimmer`**
- Skeleton for `StatCard`, `HairlineCard`, `ScoreRadarFrame`. Uses `motion.css` keyframe.
- TDD: renders; respects reduced-motion (solid bg, no shimmer).
- Est: 1 hr.

**Task D3. `ErrorPanel`**
- Props: `title`, `detail`, `retry?: () => void`.
- Used by: chat network loss, deck upload failure, Clerk session expiry mid-stream.
- TDD: clicking retry calls handler; axe clean.
- Est: 1 hr.

### Group E — Mobile shell (new)

**Task E1. Mobile nav drawer (Vaul)**
- Bottom-sheet drawer replaces `SidebarShell` below `lg`.
- `SidebarShell` stays untouched; `MobileNavDrawer` is a sibling primitive.
- TDD: RTL opens on trigger click; closes on backdrop click; focus-trapped when open.
- Est: 2 hrs.

**Task E2. Mobile-safe composer scaffolding**
- `ChatComposerShell` primitive (slot-based) with `dvh`-aware bottom docking, iOS keyboard-safe padding via `env(safe-area-inset-bottom)`.
- Content (textarea, send button, streaming state) comes from Phase 4 — this is chrome only.
- TDD: renders at `375×667` viewport without overflow; `dvh` unit class present.
- Est: 2 hrs.

### Group F — Chat kinetics (new)

**Task F1. `StreamingReveal` primitive**
- Per-token fade-in (Motion v12 `animate` with `useReducedMotion` guard).
- Used by `MentorChatCard` in Phase 4 without touching stream state.
- TDD: with reduced-motion, all content visible immediately; otherwise staggers.
- Est: 2 hrs.

**Task F2. `ThinkingIndicator` primitive**
- Three-dot editorial treatment (`DotPulse` × 3, staggered).
- TDD: renders; respects reduced-motion.
- Est: 45 min.

### Group G — Route-group tier wiring

**Task G1. Marketing route group (`/`) → `full`**
- Server-rendered; provider wraps children.
- TDD: RTL snapshot asserts `<html data-theatrics="full">` and context value `"full"`.
- Est: 30 min.

**Task G2. Auth route group (`/sign-in`, `/sign-up`) → `medium`**
- Est: 30 min.

**Task G3. Dashboard route group (`/dashboard`, `/dashboard/*`) → `calm`**
- Accept user-state override (first-session → `medium`).
- TDD: unit test `resolve-tier` with user fixtures.
- Est: 1 hr.

### Group H — Verification + quality gates

**Task H1. Playwright visual suite**
- `toHaveScreenshot()` for `/`, `/sign-in`, `/dashboard`, `/showcase` × 2 viewports (`375`, `1440`) × tier contexts.
- Baselines committed on GREEN; updated per-task.
- Est: 2 hrs.

**Task H2. `vitest-axe` on every primitive**
- Install `vitest-axe`; add `expect(await axe(container)).toHaveNoViolations()` to B1–D3.
- Est: 1 hr (mostly mechanical).

**Task H3. Upgrade verification gate**
- `.github/workflows/ci.yml` runs: `pnpm -w typecheck && pnpm -w lint && pnpm -w test --coverage && pnpm -F @zstar/web test:e2e`.
- Coverage threshold 80%; fail build otherwise.
- Ban `as any` on Motion imports via lint rule or regex grep step.
- Est: 1 hr.

**Task H4. `packages/ui` gets its own vitest config**
- Primitives tested at source, not only from `apps/web`.
- Keep integration tests in `apps/web/__tests__/`.
- Est: 45 min.

---

## Deferred (explicitly out of Phase 2)

| Item | Deferred to | Why |
|------|-------------|-----|
| View Transitions / `unstable_ViewTransition` | Phase 4 | No shared-element pairs exist until `SessionRow ↔ MentorChatCard` is built |
| `Ticker` marquee | Cut — revisit post-PMF | Pure decoration, zero user value |
| `GradientAccent` animated variant | Phase 5 polish | Static variant meets spec; animation is icing |
| Domain wrappers (`AppSidebar`, `MentorChatCard` reskin, `DeckUploadEditorial`) | Phase 3–4 | Present plan is primitives + shell only |
| Voice & microcopy doc | Spec §2.5 addendum, before Phase 3 | UX flagged: editorial typography needs editorial voice |
| Progressive-disclosure sidebar (feature unlock by `signal_coverage`) | Phase 3 AppSidebar | Requires domain knowledge shell should not have |

---

## Estimated effort

- Group A: ~4 hrs
- Group B: ~6–7 hrs (parallel)
- Group C: ~7 hrs (parallel)
- Group D: ~3 hrs (parallel)
- Group E: ~4 hrs
- Group F: ~3 hrs
- Group G: ~2 hrs
- Group H: ~5 hrs

**Total: ~3–4 working days** (vs. prior plan ~5–7 days), with more real user value (state primitives, mobile, chat kinetics) and fewer landmines (no MutationObserver, no View Transitions, no unflagged CustomCursor).

---

## Verification gate (definition of done)

All of the following must pass in CI on the Phase 2 PR:

- [ ] `pnpm -w typecheck` — zero errors, zero `any` on Motion imports
- [ ] `pnpm -w lint` — zero warnings
- [ ] `pnpm -w test --coverage` — ≥80% on `packages/ui` and new `apps/web/src/lib/theatrics/`
- [ ] `pnpm -F @zstar/web test:e2e` — Playwright visual baselines green for `/`, `/sign-in`, `/dashboard`, `/showcase` × 2 viewports
- [ ] `vitest-axe` — zero violations on B1–D3
- [ ] Manual: dev server shows tier flash is gone on route change (was the main symptom of MutationObserver race)
- [ ] Manual: `prefers-reduced-motion: reduce` disables all C-group animations

---

## Open questions (flag before starting)

1. **Flag provider**: is `NEXT_PUBLIC_CURSOR` env fine, or do we want a server-driven flag (GrowthBook/Statsig) for later experiments? — default to env var until Phase 5.
2. **User-state override source**: does `resolve-tier` read from Clerk session directly, or does the layout pass `user` in? — prefer passing in; keeps `resolve-tier` pure.
3. **Voice doc ownership**: founder-authored or Claude-drafted + founder-reviewed? — blocker for Phase 3 marketing surface.
