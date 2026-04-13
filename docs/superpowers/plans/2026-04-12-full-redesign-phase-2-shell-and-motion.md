# Full Redesign — Phase 2: Shell and Motion Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the layout primitives (`NavPill`, `SidebarShell`, `CustomCursor`), the kinetic + decorative primitives (`Ticker`, `GradientAccent`, `DotPulse`, `HeroBackdrop`, `KineticHeadline`, `ScrollReveal`), and the cross-cutting View Transitions / `data-theatrics` infrastructure so subsequent phases (shell composition + per-surface redesigns) can compose from a complete system.

**Architecture:** Primitives live in `packages/ui/src/`. Layout primitives are slot-based (they know nothing about ZStar nav items). `CustomCursor` reads `document.documentElement.dataset.theatrics` to gate itself — the attribute is set once, at the root layout, based on the matched route group. View Transitions API is wrapped at the root via Next 15's `unstable_ViewTransition`. Kinetic primitives use Motion v12 (already installed).

**Tech Stack:** Tailwind 4 `@theme` tokens (from Phase 1), Motion v12 (`motion`), CSS `animation-timeline: scroll()` / `view()` (native, no JS), Next 15 View Transitions, React 19, TypeScript strict, Vitest + React Testing Library + jsdom, Playwright for visual smoke.

**Scope for this phase:**
- Decorative primitives: `GradientAccent`, `DotPulse`, `Ticker`
- Backdrop: `HeroBackdrop` (wraps existing `AuroraBackground`)
- Layout primitives: `NavPill`, `SidebarShell`
- Global behavior: `CustomCursor` with full gating matrix + `data-theatrics` attribute
- Kinetic primitives: `KineticHeadline`, `ScrollReveal`
- Cross-cutting: `unstable_ViewTransition` wrapper at root layout
- Barrel export + primitive showcase update to render each new primitive

**Deferred to later phases:**
- `AppSidebar` domain composition + route-group `Shell` selector — Phase 3 (shell composition)
- `MentorChatCard`, `ScoreRadarFrame`, `DeckUploadEditorial`, `SessionRow` — Phase 4 (domain frames)
- Per-surface redesigns — Phase 5+
- Clerk headless migration — Phase 4 (auth phase)
- `DraggableTileGrid` + `user_preferences` JSONB migration — Phase 6 (data-reactive)

**Important:** `apps/web/AGENTS.md` warns this Next.js has breaking changes from training data. Before writing `unstable_ViewTransition` code, check `node_modules/next/dist/docs/` for the current API (it may be a named export or renamed). For Motion v12, verify `motion` (not `framer-motion`) imports — it's re-exported with the new name.

**Spec reference:** `docs/superpowers/specs/2026-04-12-full-redesign-design.md` sections 3.3, 3.5, 3.6, 4.1, 4.2, 4.3, 5.*

**Phase 1 state:** all foundation tokens + typographic/surface primitives landed on `feat/redesign-phase-1`. Phase 2 starts after Phase 1 merges to main, or branches off `feat/redesign-phase-1`.

---

## File Structure

### Created

- `packages/ui/src/decorative/gradient-accent.tsx` — gradient-text wrapper primitive
- `packages/ui/src/decorative/dot-pulse.tsx` — 7px pulsing dot for live status
- `packages/ui/src/decorative/ticker.tsx` — horizontal marquee with gradient `—` separators
- `packages/ui/src/layout/hero-backdrop.tsx` — aurora/beam composition wrapper
- `packages/ui/src/layout/nav-pill.tsx` — floating pill nav primitive
- `packages/ui/src/layout/sidebar-shell.tsx` — slot-based sidebar shell
- `packages/ui/src/layout/custom-cursor.tsx` — global custom cursor with gating matrix
- `packages/ui/src/kinetic/kinetic-headline.tsx` — per-glyph staggered headline via Motion v12
- `packages/ui/src/kinetic/scroll-reveal.tsx` — CSS scroll-linked reveal wrapper
- `packages/ui/src/lib/use-theatrics.ts` — hook reading `data-theatrics` from `<html>`
- `apps/web/src/components/view-transitions-provider.tsx` — client wrapper for `unstable_ViewTransition`
- `apps/web/src/__tests__/ui/gradient-accent.test.tsx`
- `apps/web/src/__tests__/ui/dot-pulse.test.tsx`
- `apps/web/src/__tests__/ui/ticker.test.tsx`
- `apps/web/src/__tests__/ui/hero-backdrop.test.tsx`
- `apps/web/src/__tests__/ui/nav-pill.test.tsx`
- `apps/web/src/__tests__/ui/sidebar-shell.test.tsx`
- `apps/web/src/__tests__/ui/custom-cursor.test.tsx`
- `apps/web/src/__tests__/ui/kinetic-headline.test.tsx`
- `apps/web/src/__tests__/ui/scroll-reveal.test.tsx`
- `apps/web/src/__tests__/ui/use-theatrics.test.tsx`

### Modified

- `packages/ui/src/index.ts` — barrel export for new primitives
- `packages/ui/package.json` — add `./decorative/*`, `./layout/*`, `./kinetic/*`, `./lib/*` subpath exports
- `packages/ui/src/styles/tokens.css` — add scroll-reveal `@keyframes` + cursor CSS + motion tokens for hero/ticker
- `apps/web/src/app/layout.tsx` — mount `ViewTransitionsProvider` + set `data-theatrics` attribute on `<html>` based on default tier (`full`); wire `CustomCursor`
- `apps/web/src/app/(dashboard)/layout.tsx` — override `data-theatrics` to `medium` (or `calm` for chat/sessions/scores subroutes via segment-layout)
- `apps/web/src/app/(dashboard)/dashboard/chat/layout.tsx` — create if missing; set `data-theatrics="calm"`
- `apps/web/src/app/(showcase)/showcase/page.tsx` — extend with new primitive sections

---

## Testing Conventions

- Unit tests under `apps/web/src/__tests__/ui/` (Vitest + jsdom, existing config).
- Tests use Testing Library (no shallow rendering). Each primitive covers: (a) renders, (b) one variant-distinguishing class or data attribute, (c) one behavior (gating, animation attribute, reduced-motion fallback).
- `CustomCursor` gating tests mock `window.matchMedia`, `document.documentElement.dataset`, `document.querySelector('iframe')`, and the target element attributes (`data-no-cursor`, Clerk `.cl-rootBox *`).
- Motion assertions: check for the class or `animate` prop presence, not computed style (jsdom doesn't run animations).
- Typecheck gate: `cd /Users/possible/Documents/Zstar && pnpm -F @zstar/web exec tsc --noEmit` after every task.

---

## Task 1: `GradientAccent` Primitive

**Files:**
- Create: `packages/ui/src/decorative/gradient-accent.tsx`
- Create: `apps/web/src/__tests__/ui/gradient-accent.test.tsx`
- Modify: `packages/ui/package.json` (add `./decorative/*` subpath export)

**Context:** Simple reusable gradient-clipped text wrapper. Many surfaces want gradient emphasis on a word without the full `Display`/`<em>` path (e.g., stat values, eyebrow labels already handled, chip-inline emphasis).

- [ ] **Step 1: Update `packages/ui/package.json` exports**

Add sibling entry to existing `./surface/*`, `./typographic/*`, `./hooks/*`:

```json
"./decorative/*": {
  "types": "./src/decorative/*.tsx",
  "default": "./src/decorative/*.tsx"
},
```

- [ ] **Step 2: Write failing test at `apps/web/src/__tests__/ui/gradient-accent.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GradientAccent } from "@zstar/ui/decorative/gradient-accent";

describe("GradientAccent", () => {
  it("renders children as a span with gradient-clipped text", () => {
    render(<GradientAccent>signals</GradientAccent>);
    const el = screen.getByText("signals");
    expect(el.className).toContain("bg-[image:var(--gradient-flow)]");
    expect(el.className).toContain("bg-clip-text");
    expect(el.className).toContain("text-transparent");
  });

  it("uses brand gradient when variant='brand'", () => {
    render(<GradientAccent variant="brand">brand</GradientAccent>);
    const el = screen.getByText("brand");
    expect(el.className).toContain("bg-[image:var(--gradient-brand)]");
  });

  it("animates by default (has zstar-gradient-em class) and stops when static prop set", () => {
    const { rerender } = render(<GradientAccent>on</GradientAccent>);
    expect(screen.getByText("on").className).toContain("zstar-gradient-em");
    rerender(<GradientAccent static>off</GradientAccent>);
    expect(screen.getByText("off").className).not.toContain("zstar-gradient-em");
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
cd /Users/possible/Documents/Zstar && pnpm -F @zstar/web test -- gradient-accent
```

- [ ] **Step 4: Implement `packages/ui/src/decorative/gradient-accent.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

interface GradientAccentProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "flow" | "brand";
  static?: boolean;
  children: React.ReactNode;
}

export function GradientAccent({
  variant = "flow",
  static: isStatic = false,
  className,
  children,
  ...rest
}: GradientAccentProps) {
  const gradientClass =
    variant === "brand"
      ? "bg-[image:var(--gradient-brand)]"
      : "bg-[image:var(--gradient-flow)]";

  return (
    <span
      className={cn(
        gradientClass,
        "bg-clip-text text-transparent",
        !isStatic && "bg-[size:300%_300%] zstar-gradient-em",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Run — expect PASS (3 tests)**

- [ ] **Step 6: Typecheck**

```bash
cd /Users/possible/Documents/Zstar && pnpm -F @zstar/web exec tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/decorative/gradient-accent.tsx apps/web/src/__tests__/ui/gradient-accent.test.tsx packages/ui/package.json
git commit -m "feat(ui): GradientAccent primitive"
```

---

## Task 2: `DotPulse` Primitive

**Files:**
- Create: `packages/ui/src/decorative/dot-pulse.tsx`
- Create: `apps/web/src/__tests__/ui/dot-pulse.test.tsx`
- Modify: `packages/ui/src/styles/tokens.css` (add `@keyframes zstar-dot-pulse`)

**Context:** A 7px dot with a soft pulse, used next to mono labels to signal "live" / "listening" / "streaming". Reduced-motion disables the pulse.

- [ ] **Step 1: Append pulse keyframe to `packages/ui/src/styles/tokens.css`** (at end of file, outside `@theme`):

```css
@keyframes zstar-dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.45); }
  50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(124, 58, 237, 0); }
}

.zstar-dot-pulse {
  animation: zstar-dot-pulse 1800ms cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@media (prefers-reduced-motion: reduce) {
  .zstar-dot-pulse { animation: none; }
}
```

- [ ] **Step 2: Write failing test at `apps/web/src/__tests__/ui/dot-pulse.test.tsx`**

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DotPulse } from "@zstar/ui/decorative/dot-pulse";

describe("DotPulse", () => {
  it("renders a 7px round gradient-brand dot by default", () => {
    const { container } = render(<DotPulse />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("SPAN");
    expect(el.className).toContain("w-[7px]");
    expect(el.className).toContain("h-[7px]");
    expect(el.className).toContain("rounded-full");
    expect(el.className).toContain("zstar-dot-pulse");
  });

  it("accepts a label via aria-label", () => {
    const { container } = render(<DotPulse aria-label="streaming" />);
    expect(container.firstChild).toHaveAttribute("aria-label", "streaming");
  });

  it("stops animation when static prop is true", () => {
    const { container } = render(<DotPulse static />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("zstar-dot-pulse");
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Implement `packages/ui/src/decorative/dot-pulse.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

interface DotPulseProps extends React.HTMLAttributes<HTMLSpanElement> {
  static?: boolean;
}

export function DotPulse({
  static: isStatic = false,
  className,
  ...rest
}: DotPulseProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-block w-[7px] h-[7px] rounded-full bg-[image:var(--gradient-brand)]",
        !isStatic && "zstar-dot-pulse",
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 5: Run — expect PASS (3 tests)**

- [ ] **Step 6: Typecheck**

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/decorative/dot-pulse.tsx apps/web/src/__tests__/ui/dot-pulse.test.tsx packages/ui/src/styles/tokens.css
git commit -m "feat(ui): DotPulse primitive with pulsing gradient dot"
```

---

## Task 3: `Ticker` Primitive (marquee)

**Files:**
- Create: `packages/ui/src/decorative/ticker.tsx`
- Create: `apps/web/src/__tests__/ui/ticker.test.tsx`
- Modify: `packages/ui/src/styles/tokens.css` (add `@keyframes zstar-ticker-scroll`)

**Context:** Horizontal marquee of mono entries separated by gradient `—` glyphs. Used on landing hero and `/onboarding/ready`. Native CSS animation, no JS. Pauses on hover and under `prefers-reduced-motion`.

- [ ] **Step 1: Append ticker keyframe to `packages/ui/src/styles/tokens.css`**

```css
@keyframes zstar-ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.zstar-ticker-track {
  animation: zstar-ticker-scroll 40s linear infinite;
  will-change: transform;
}
.zstar-ticker-root:hover .zstar-ticker-track { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .zstar-ticker-track { animation: none; }
}
```

- [ ] **Step 2: Write failing test at `apps/web/src/__tests__/ui/ticker.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Ticker } from "@zstar/ui/decorative/ticker";

describe("Ticker", () => {
  it("renders each entry twice (for seamless loop)", () => {
    render(<Ticker entries={["FOUNDER", "DECK", "SIGNALS"]} />);
    expect(screen.getAllByText("FOUNDER")).toHaveLength(2);
    expect(screen.getAllByText("DECK")).toHaveLength(2);
  });

  it("inserts a gradient em-dash between entries", () => {
    const { container } = render(<Ticker entries={["A", "B"]} />);
    const seps = container.querySelectorAll("[data-ticker-sep]");
    // 2 entries * 2 (doubled) = 4 items; 4-1 = 3 separators per track, but the
    // doubled track flattens to 4 separators (A — B — A — B)
    expect(seps.length).toBeGreaterThanOrEqual(3);
  });

  it("applies zstar-ticker-track class to the moving track", () => {
    const { container } = render(<Ticker entries={["x"]} />);
    expect(container.querySelector(".zstar-ticker-track")).not.toBeNull();
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Implement `packages/ui/src/decorative/ticker.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

interface TickerProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: ReadonlyArray<string>;
  speedSeconds?: number;
}

function TickerTrack({ entries }: { entries: ReadonlyArray<string> }) {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {entries.map((entry, i) => (
        <React.Fragment key={i}>
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[var(--color-muted)] whitespace-nowrap">
            {entry}
          </span>
          <span
            data-ticker-sep
            aria-hidden="true"
            className="bg-[image:var(--gradient-flow)] bg-clip-text text-transparent font-[family-name:var(--font-display)] text-[14px]"
          >
            —
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function Ticker({
  entries,
  speedSeconds,
  className,
  style,
  ...rest
}: TickerProps) {
  const trackStyle: React.CSSProperties = speedSeconds
    ? { animationDuration: `${speedSeconds}s` }
    : {};

  return (
    <div
      className={cn(
        "zstar-ticker-root relative w-full overflow-hidden",
        "border-y border-[var(--color-border)] py-3",
        className,
      )}
      style={style}
      {...rest}
    >
      <div className="zstar-ticker-track flex w-max" style={trackStyle}>
        <TickerTrack entries={entries} />
        <TickerTrack entries={entries} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run — expect PASS (3 tests)**

- [ ] **Step 6: Typecheck**

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/decorative/ticker.tsx apps/web/src/__tests__/ui/ticker.test.tsx packages/ui/src/styles/tokens.css
git commit -m "feat(ui): Ticker marquee primitive with gradient separators"
```

---

## Task 4: `HeroBackdrop` Primitive

**Files:**
- Create: `packages/ui/src/layout/hero-backdrop.tsx`
- Create: `apps/web/src/__tests__/ui/hero-backdrop.test.tsx`
- Modify: `packages/ui/package.json` (add `./layout/*` export)

**Context:** Wraps the existing `AuroraBackground` primitive (from `packages/ui/src/aceternity/aurora-background.tsx`) with editorial framing — hairline borders, vignette fade, and slot for content. Used on `/sign-in`, `/sign-up`, `/invite`, landing hero.

- [ ] **Step 1: Update `packages/ui/package.json` exports** — add `./layout/*`:

```json
"./layout/*": {
  "types": "./src/layout/*.tsx",
  "default": "./src/layout/*.tsx"
},
```

- [ ] **Step 2: Write failing test at `apps/web/src/__tests__/ui/hero-backdrop.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroBackdrop } from "@zstar/ui/layout/hero-backdrop";

describe("HeroBackdrop", () => {
  it("renders children inside the backdrop", () => {
    render(
      <HeroBackdrop>
        <div>Content</div>
      </HeroBackdrop>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("mounts an aurora element behind the content", () => {
    const { container } = render(
      <HeroBackdrop>
        <div>x</div>
      </HeroBackdrop>,
    );
    expect(container.querySelector("[data-hero-aurora]")).not.toBeNull();
  });

  it("applies vignette overlay when vignette prop is set", () => {
    const { container } = render(
      <HeroBackdrop vignette>
        <div>x</div>
      </HeroBackdrop>,
    );
    expect(container.querySelector("[data-hero-vignette]")).not.toBeNull();
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Implement `packages/ui/src/layout/hero-backdrop.tsx`**

```tsx
import * as React from "react";
import { AuroraBackground } from "../aceternity/aurora-background";
import { cn } from "../utils";

interface HeroBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  vignette?: boolean;
  children: React.ReactNode;
}

export function HeroBackdrop({
  vignette = false,
  className,
  children,
  ...rest
}: HeroBackdropProps) {
  return (
    <div
      className={cn(
        "relative isolate min-h-screen w-full overflow-hidden bg-[var(--color-bg)]",
        className,
      )}
      {...rest}
    >
      <div
        data-hero-aurora
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60"
      >
        <AuroraBackground className="h-full w-full">
          <span className="sr-only">background</span>
        </AuroraBackground>
      </div>
      {vignette && (
        <div
          data-hero-vignette
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[5] bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg)_75%)]"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: Run — expect PASS (3 tests)**

- [ ] **Step 6: Typecheck**

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/layout/hero-backdrop.tsx apps/web/src/__tests__/ui/hero-backdrop.test.tsx packages/ui/package.json
git commit -m "feat(ui): HeroBackdrop primitive wrapping aurora"
```

---

## Task 5: `NavPill` Primitive

**Files:**
- Create: `packages/ui/src/layout/nav-pill.tsx`
- Create: `apps/web/src/__tests__/ui/nav-pill.test.tsx`

**Context:** Floating pill nav — gradient logo left, link list center, CTA right. Primitive knows nothing about ZStar-specific links; consumer passes `logo`, `links`, `cta` as props. Used by marketing/public shells.

- [ ] **Step 1: Write failing test at `apps/web/src/__tests__/ui/nav-pill.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NavPill } from "@zstar/ui/layout/nav-pill";

describe("NavPill", () => {
  it("renders logo, links, and cta in order", () => {
    render(
      <NavPill
        logo={<span data-slot="logo">Z</span>}
        links={[
          { href: "/product", label: "Product" },
          { href: "/pricing", label: "Pricing" },
        ]}
        cta={<a href="/sign-up" data-slot="cta">Start</a>}
      />,
    );
    expect(screen.getByText("Z")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Product" })).toHaveAttribute("href", "/product");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("marks the active link by href match", () => {
    render(
      <NavPill
        logo={null}
        activeHref="/pricing"
        links={[
          { href: "/product", label: "Product" },
          { href: "/pricing", label: "Pricing" },
        ]}
        cta={null}
      />,
    );
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Product" })).not.toHaveAttribute("aria-current");
  });

  it("renders as a fixed top-centered nav", () => {
    const { container } = render(
      <NavPill logo={null} links={[]} cta={null} />,
    );
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();
    expect(nav?.className).toContain("fixed");
    expect(nav?.className).toContain("top-");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `packages/ui/src/layout/nav-pill.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

export interface NavPillLink {
  href: string;
  label: string;
}

interface NavPillProps {
  logo: React.ReactNode;
  links: ReadonlyArray<NavPillLink>;
  cta: React.ReactNode;
  activeHref?: string;
  className?: string;
}

export function NavPill({ logo, links, cta, activeHref, className }: NavPillProps) {
  return (
    <nav
      className={cn(
        "fixed top-8 left-1/2 z-40 -translate-x-1/2",
        "flex items-center gap-6 px-3 py-2 rounded-full",
        "bg-[color:rgba(0,0,0,0.7)] backdrop-blur-md",
        "border border-[var(--color-border-interactive)]",
        className,
      )}
    >
      {logo && <div className="pl-2">{logo}</div>}
      <ul className="flex items-center gap-1">
        {links.map((link) => {
          const isActive = activeHref === link.href;
          return (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "px-3 py-1.5 text-[12px] font-[family-name:var(--font-mono)] tracking-[0.06em] uppercase",
                  "transition-colors duration-200",
                  isActive
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
      {cta && <div className="pr-1">{cta}</div>}
    </nav>
  );
}
```

- [ ] **Step 4: Run — expect PASS (3 tests)**

- [ ] **Step 5: Typecheck**

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/layout/nav-pill.tsx apps/web/src/__tests__/ui/nav-pill.test.tsx
git commit -m "feat(ui): NavPill primitive with slot-based logo/links/cta"
```

---

## Task 6: `SidebarShell` Primitive

**Files:**
- Create: `packages/ui/src/layout/sidebar-shell.tsx`
- Create: `apps/web/src/__tests__/ui/sidebar-shell.test.tsx`

**Context:** Slot-based fixed-left sidebar: 240px, hairline right border. Accepts `brand`, `nav`, `footer` slots. Primitive knows nothing about ZStar's nav items — the `AppSidebar` composition in Phase 3 wraps this and injects Dashboard/Sessions/Scores/etc.

- [ ] **Step 1: Write failing test at `apps/web/src/__tests__/ui/sidebar-shell.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SidebarShell } from "@zstar/ui/layout/sidebar-shell";

describe("SidebarShell", () => {
  it("renders brand, nav, and footer slots", () => {
    render(
      <SidebarShell
        brand={<span>BRAND</span>}
        nav={<nav>NAV</nav>}
        footer={<footer>FOOT</footer>}
      />,
    );
    expect(screen.getByText("BRAND")).toBeInTheDocument();
    expect(screen.getByText("NAV")).toBeInTheDocument();
    expect(screen.getByText("FOOT")).toBeInTheDocument();
  });

  it("is fixed-left 240px with hairline right border", () => {
    const { container } = render(
      <SidebarShell brand={null} nav={null} footer={null} />,
    );
    const aside = container.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.className).toContain("fixed");
    expect(aside?.className).toContain("left-0");
    expect(aside?.className).toContain("w-[240px]");
    expect(aside?.className).toContain("border-r");
    expect(aside?.className).toContain("border-[var(--color-border)]");
  });

  it("hides on screens below lg breakpoint", () => {
    const { container } = render(
      <SidebarShell brand={null} nav={null} footer={null} />,
    );
    const aside = container.querySelector("aside");
    expect(aside?.className).toContain("hidden");
    expect(aside?.className).toContain("lg:flex");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `packages/ui/src/layout/sidebar-shell.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

interface SidebarShellProps {
  brand: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
}

export function SidebarShell({ brand, nav, footer, className }: SidebarShellProps) {
  return (
    <aside
      className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 z-30 w-[240px]",
        "flex-col",
        "bg-[var(--color-bg)] border-r border-[var(--color-border)]",
        "py-8",
        className,
      )}
    >
      <div className="px-6">{brand}</div>
      <div className="flex-1 overflow-y-auto px-3 mt-10">{nav}</div>
      <div className="px-6 pt-6 border-t border-[var(--color-border)]">{footer}</div>
    </aside>
  );
}
```

- [ ] **Step 4: Run — expect PASS (3 tests)**

- [ ] **Step 5: Typecheck**

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/layout/sidebar-shell.tsx apps/web/src/__tests__/ui/sidebar-shell.test.tsx
git commit -m "feat(ui): SidebarShell slot primitive"
```

---

## Task 7: `useTheatrics` Hook + `CustomCursor` Primitive

**Files:**
- Create: `packages/ui/src/lib/use-theatrics.ts`
- Create: `packages/ui/src/layout/custom-cursor.tsx`
- Create: `apps/web/src/__tests__/ui/use-theatrics.test.tsx`
- Create: `apps/web/src/__tests__/ui/custom-cursor.test.tsx`
- Modify: `packages/ui/package.json` (add `./lib/*` subpath export)
- Modify: `packages/ui/src/styles/tokens.css` (add cursor CSS)

**Context:** `CustomCursor` is the most gate-heavy primitive in the system. All 7 gates from spec §4.1:

1. `"use client"` + mount only after hydration (`useEffect`)
2. `@media (pointer: fine)` — disabled on touch devices
3. Respects `prefers-reduced-motion`
4. Hidden over input/editable elements and Clerk portals
5. Disabled when `window.self !== window.top` (iframes)
6. Tier-gated: reads `document.documentElement.dataset.theatrics`; no-op on `calm`
7. `mix-blend-mode: screen` for visibility on any backdrop

The `useTheatrics` hook centralizes gate 6 so it can be reused by `KineticHeadline` and `ScrollReveal`.

- [ ] **Step 1: Update `packages/ui/package.json` exports** — add `./lib/*`:

```json
"./lib/*": {
  "types": "./src/lib/*.ts",
  "default": "./src/lib/*.ts"
},
```

- [ ] **Step 2: Append cursor styles to `packages/ui/src/styles/tokens.css`**

```css
.zstar-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--gradient-brand);
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 9999;
  transform: translate3d(-50%, -50%, 0);
  transition: opacity 120ms linear;
  will-change: transform;
}
.zstar-cursor[data-hidden="true"] { opacity: 0; }
@media (pointer: coarse), (prefers-reduced-motion: reduce) {
  .zstar-cursor { display: none; }
}
html[data-theatrics="calm"] .zstar-cursor { display: none; }
```

- [ ] **Step 3: Write `useTheatrics` test at `apps/web/src/__tests__/ui/use-theatrics.test.tsx`**

```tsx
import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useTheatrics } from "@zstar/ui/lib/use-theatrics";

describe("useTheatrics", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theatrics");
  });

  it("returns 'full' when no attribute is set", () => {
    const { result } = renderHook(() => useTheatrics());
    expect(result.current).toBe("full");
  });

  it("returns the attribute value when set", () => {
    document.documentElement.setAttribute("data-theatrics", "medium");
    const { result } = renderHook(() => useTheatrics());
    expect(result.current).toBe("medium");
  });

  it("coerces unknown values to 'full'", () => {
    document.documentElement.setAttribute("data-theatrics", "bogus");
    const { result } = renderHook(() => useTheatrics());
    expect(result.current).toBe("full");
  });
});
```

- [ ] **Step 4: Implement `packages/ui/src/lib/use-theatrics.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

export type TheatricsTier = "full" | "medium" | "calm";

function readTier(): TheatricsTier {
  if (typeof document === "undefined") return "full";
  const raw = document.documentElement.dataset.theatrics;
  if (raw === "medium" || raw === "calm" || raw === "full") return raw;
  return "full";
}

export function useTheatrics(): TheatricsTier {
  const [tier, setTier] = useState<TheatricsTier>(() => readTier());

  useEffect(() => {
    setTier(readTier());
    const observer = new MutationObserver(() => setTier(readTier()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theatrics"] });
    return () => observer.disconnect();
  }, []);

  return tier;
}
```

- [ ] **Step 5: Run `useTheatrics` test — expect PASS (3 tests)**

- [ ] **Step 6: Write `CustomCursor` test at `apps/web/src/__tests__/ui/custom-cursor.test.tsx`**

```tsx
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CustomCursor } from "@zstar/ui/layout/custom-cursor";

function mockMatchMedia(matches: (q: string) => boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: matches(q),
      media: q,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("CustomCursor", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theatrics");
    mockMatchMedia((q) => q.includes("pointer: fine") && !q.includes("reduce"));
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theatrics");
  });

  it("renders a cursor element when theatrics is full", () => {
    const { container } = render(<CustomCursor />);
    expect(container.querySelector(".zstar-cursor")).not.toBeNull();
  });

  it("does NOT render when theatrics is calm", () => {
    document.documentElement.setAttribute("data-theatrics", "calm");
    const { container } = render(<CustomCursor />);
    expect(container.querySelector(".zstar-cursor")).toBeNull();
  });

  it("does NOT render when pointer is coarse (touch)", () => {
    mockMatchMedia((q) => q.includes("pointer: coarse"));
    const { container } = render(<CustomCursor />);
    expect(container.querySelector(".zstar-cursor")).toBeNull();
  });

  it("does NOT render when prefers-reduced-motion is set", () => {
    mockMatchMedia((q) => q.includes("reduce"));
    const { container } = render(<CustomCursor />);
    expect(container.querySelector(".zstar-cursor")).toBeNull();
  });

  it("hides the cursor when hovering an input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    const { container } = render(<CustomCursor />);
    const cursor = container.querySelector(".zstar-cursor") as HTMLElement;
    act(() => {
      input.dispatchEvent(new Event("mouseover", { bubbles: true }));
    });
    expect(cursor.getAttribute("data-hidden")).toBe("true");
    document.body.removeChild(input);
  });
});
```

- [ ] **Step 7: Run — expect FAIL**

- [ ] **Step 8: Implement `packages/ui/src/layout/custom-cursor.tsx`**

```tsx
"use client";

import * as React from "react";
import { useTheatrics } from "../lib/use-theatrics";

const HIDE_SELECTORS =
  "input, textarea, [contenteditable='true'], [data-no-cursor], iframe, .cl-rootBox *";

function matches(el: Element | null, selector: string): boolean {
  return !!el && el.matches(selector);
}

function isTouch(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isNestedFrame(): boolean {
  return typeof window !== "undefined" && window.self !== window.top;
}

export function CustomCursor() {
  const tier = useTheatrics();
  const [mounted, setMounted] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    if (tier === "calm") return;
    if (isTouch() || prefersReducedMotion() || isNestedFrame()) return;

    const node = ref.current;
    if (!node) return;

    const onMove = (event: PointerEvent) => {
      node.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate3d(-50%, -50%, 0)`;
    };

    const onOver = (event: Event) => {
      const target = event.target as Element | null;
      const hidden = matches(target, HIDE_SELECTORS) || target?.closest(HIDE_SELECTORS) != null;
      node.setAttribute("data-hidden", hidden ? "true" : "false");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("mouseover", onOver, true);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mouseover", onOver, true);
    };
  }, [mounted, tier]);

  if (!mounted) return null;
  if (tier === "calm") return null;
  if (isTouch() || prefersReducedMotion() || isNestedFrame()) return null;

  return <div ref={ref} className="zstar-cursor" data-hidden="false" aria-hidden="true" />;
}
```

- [ ] **Step 9: Run — expect PASS (5 tests)**

- [ ] **Step 10: Typecheck**

- [ ] **Step 11: Commit**

```bash
git add packages/ui/src/lib/use-theatrics.ts packages/ui/src/layout/custom-cursor.tsx apps/web/src/__tests__/ui/use-theatrics.test.tsx apps/web/src/__tests__/ui/custom-cursor.test.tsx packages/ui/src/styles/tokens.css packages/ui/package.json
git commit -m "feat(ui): CustomCursor primitive with theatrics tier gating"
```

---

## Task 8: `KineticHeadline` Primitive

**Files:**
- Create: `packages/ui/src/kinetic/kinetic-headline.tsx`
- Create: `apps/web/src/__tests__/ui/kinetic-headline.test.tsx`
- Modify: `packages/ui/package.json` (add `./kinetic/*` export)

**Context:** Splits a `Display`-style headline per-glyph, animates each glyph in with a staggered spring via Motion v12. Reads `useTheatrics` — when `calm`, renders a plain `Display` with no animation. Used on landing hero, `/onboarding/ready`, `/cold-read` hero.

Motion v12 is imported as `import { motion } from "motion/react"` (not `framer-motion`).

- [ ] **Step 1: Update `packages/ui/package.json` exports** — add `./kinetic/*`:

```json
"./kinetic/*": {
  "types": "./src/kinetic/*.tsx",
  "default": "./src/kinetic/*.tsx"
},
```

- [ ] **Step 2: Write failing test at `apps/web/src/__tests__/ui/kinetic-headline.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { KineticHeadline } from "@zstar/ui/kinetic/kinetic-headline";

describe("KineticHeadline", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theatrics");
  });

  it("renders the full text (accessible)", () => {
    render(<KineticHeadline>Hello world</KineticHeadline>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello world");
  });

  it("splits text into per-glyph spans when theatrics is not calm", () => {
    const { container } = render(<KineticHeadline>Hi</KineticHeadline>);
    const glyphs = container.querySelectorAll("[data-glyph]");
    // 2 characters
    expect(glyphs.length).toBe(2);
  });

  it("renders no per-glyph spans when theatrics is calm", () => {
    document.documentElement.setAttribute("data-theatrics", "calm");
    const { container } = render(<KineticHeadline>Hi</KineticHeadline>);
    expect(container.querySelectorAll("[data-glyph]").length).toBe(0);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Implement `packages/ui/src/kinetic/kinetic-headline.tsx`**

```tsx
"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Display } from "../typographic/display";
import { useTheatrics } from "../lib/use-theatrics";

interface KineticHeadlineProps {
  children: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function KineticHeadline({ children, as = "h1", className }: KineticHeadlineProps) {
  const tier = useTheatrics();

  if (tier === "calm") {
    return (
      <Display as={as} className={className}>
        {children}
      </Display>
    );
  }

  const glyphs = Array.from(children);

  return (
    <Display as={as} className={className} aria-label={children}>
      <span aria-hidden="true">
        {glyphs.map((glyph, i) => (
          <motion.span
            key={i}
            data-glyph
            style={{ display: "inline-block", whiteSpace: "pre" }}
            initial={{ y: "60%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              delay: i * 0.025,
              type: "spring",
              stiffness: 320,
              damping: 26,
            }}
          >
            {glyph}
          </motion.span>
        ))}
      </span>
    </Display>
  );
}
```

- [ ] **Step 5: Run — expect PASS (3 tests)**

- [ ] **Step 6: Typecheck**

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/kinetic/kinetic-headline.tsx apps/web/src/__tests__/ui/kinetic-headline.test.tsx packages/ui/package.json
git commit -m "feat(ui): KineticHeadline primitive with per-glyph Motion stagger"
```

---

## Task 9: `ScrollReveal` Primitive

**Files:**
- Create: `packages/ui/src/kinetic/scroll-reveal.tsx`
- Create: `apps/web/src/__tests__/ui/scroll-reveal.test.tsx`
- Modify: `packages/ui/src/styles/tokens.css` (add scroll-timeline CSS)

**Context:** Native CSS `animation-timeline: view()` for reveals on long editorial surfaces. Zero JS cost. The primitive is just a `<div>` with the animation class; falls back to `opacity: 1` where `animation-timeline` is unsupported and under `prefers-reduced-motion` or `data-theatrics="calm"`.

- [ ] **Step 1: Append scroll-reveal CSS to `packages/ui/src/styles/tokens.css`**

```css
@supports (animation-timeline: view()) {
  @keyframes zstar-reveal-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .zstar-scroll-reveal {
    animation: zstar-reveal-up linear both;
    animation-timeline: view();
    animation-range: entry 10% cover 30%;
  }

  @media (prefers-reduced-motion: reduce) {
    .zstar-scroll-reveal { animation: none; opacity: 1; transform: none; }
  }

  html[data-theatrics="calm"] .zstar-scroll-reveal {
    animation: none; opacity: 1; transform: none;
  }
}
```

- [ ] **Step 2: Write failing test at `apps/web/src/__tests__/ui/scroll-reveal.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScrollReveal } from "@zstar/ui/kinetic/scroll-reveal";

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(<ScrollReveal><p>text</p></ScrollReveal>);
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("applies zstar-scroll-reveal class by default", () => {
    const { container } = render(<ScrollReveal><p>x</p></ScrollReveal>);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("zstar-scroll-reveal");
  });

  it("omits the reveal class when disabled prop is true", () => {
    const { container } = render(<ScrollReveal disabled><p>x</p></ScrollReveal>);
    const root = container.firstChild as HTMLElement;
    expect(root.className).not.toContain("zstar-scroll-reveal");
  });

  it("forwards arbitrary class names", () => {
    const { container } = render(
      <ScrollReveal className="custom-class"><p>x</p></ScrollReveal>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("custom-class");
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Implement `packages/ui/src/kinetic/scroll-reveal.tsx`**

```tsx
import * as React from "react";
import { cn } from "../utils";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  children: React.ReactNode;
}

export function ScrollReveal({
  disabled = false,
  className,
  children,
  ...rest
}: ScrollRevealProps) {
  return (
    <div className={cn(!disabled && "zstar-scroll-reveal", className)} {...rest}>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Run — expect PASS (4 tests)**

- [ ] **Step 6: Typecheck**

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/kinetic/scroll-reveal.tsx apps/web/src/__tests__/ui/scroll-reveal.test.tsx packages/ui/src/styles/tokens.css
git commit -m "feat(ui): ScrollReveal primitive using CSS view() timeline"
```

---

## Task 10: View Transitions Wrapper + `data-theatrics` Root Attribute

**Files:**
- Create: `apps/web/src/components/view-transitions-provider.tsx`
- Modify: `apps/web/src/app/layout.tsx`

**Context:** Next 15 ships `unstable_ViewTransition` as a named export from `next/navigation` OR `next/view-transitions` depending on version — check `node_modules/next/dist/docs/` before writing. This task wraps the entire `<body>` children in a client-side `<ViewTransitions>` component and mounts `CustomCursor`. It also sets the default `data-theatrics="full"` on `<html>`.

If `unstable_ViewTransition` is not yet in the installed Next build (e.g., behind a flag), gracefully fall back to a pass-through wrapper. The goal is to be ready; the tier/route-group overrides in the next task are what unlock the shared-element animations.

- [ ] **Step 1: Check installed Next version for View Transitions API**

```bash
ls /Users/possible/Documents/Zstar/node_modules/next/dist/docs/ 2>/dev/null | head
cat /Users/possible/Documents/Zstar/node_modules/next/package.json | grep '"version"'
# grep for the export:
grep -rn "ViewTransition" /Users/possible/Documents/Zstar/node_modules/next/dist/esm/client/ 2>/dev/null | head -5
grep -rn "unstable_ViewTransition" /Users/possible/Documents/Zstar/node_modules/next/ 2>/dev/null | head -5
```

Record the export path you find. If none exists, the provider is a pass-through.

- [ ] **Step 2: Create `apps/web/src/components/view-transitions-provider.tsx`**

If `unstable_ViewTransition` is exported (likely from `next` or `next/navigation`):

```tsx
"use client";

import * as React from "react";
// Adjust import path based on Step 1 findings. Common forms:
//   import { unstable_ViewTransition as ViewTransition } from "next/navigation";
//   import { unstable_ViewTransition as ViewTransition } from "next";
// If neither works, keep the fallback below and remove the import.
import { unstable_ViewTransition as ViewTransition } from "next";

export function ViewTransitionsProvider({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}
```

If `unstable_ViewTransition` is NOT present in the installed Next version, implement as pass-through:

```tsx
"use client";

import * as React from "react";

export function ViewTransitionsProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Modify `apps/web/src/app/layout.tsx`**

Add the `data-theatrics="full"` attribute to `<html>`, mount `CustomCursor` inside `<body>`, and wrap children with `ViewTransitionsProvider`. The relevant section (inside the return) becomes:

```tsx
import { CustomCursor } from "@zstar/ui/layout/custom-cursor";
import { ViewTransitionsProvider } from "@/components/view-transitions-provider";

// ... existing font declarations ...

return (
  <ClerkProvider appearance={{ baseTheme: dark }}>
    <html
      lang="en"
      data-theatrics="full"
      className={`dark ${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="antialiased">
        <ViewTransitionsProvider>
          <Providers>{children}</Providers>
        </ViewTransitionsProvider>
        <CustomCursor />
      </body>
    </html>
  </ClerkProvider>
);
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/possible/Documents/Zstar && pnpm -F @zstar/web exec tsc --noEmit
```

- [ ] **Step 5: Dev-server smoke**

```bash
pnpm -F @zstar/web dev
```

Open `http://localhost:3000/` in a desktop browser (pointer: fine, not touch). Expected:
- Gradient dot cursor follows pointer with `mix-blend-mode: screen`
- Over an input, cursor becomes transparent and native caret shows
- No console errors; no layout shift

If `unstable_ViewTransition` is unavailable, navigation works normally (pass-through). If available, route changes feel like a morph rather than a hard cut.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/view-transitions-provider.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): mount ViewTransitionsProvider, CustomCursor, and data-theatrics=full on root"
```

---

## Task 11: Route-Group `data-theatrics` Overrides

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` — set `medium`
- Create (if missing): `apps/web/src/app/(dashboard)/dashboard/chat/layout.tsx` — set `calm`
- Create (if missing): `apps/web/src/app/(dashboard)/dashboard/sessions/layout.tsx` — set `calm`
- Create (if missing): `apps/web/src/app/(dashboard)/dashboard/scores/layout.tsx` — set `calm`

**Context:** Layouts cannot directly set `data-theatrics` on `<html>` (that's the root layout's domain). Instead, each route-group layout mounts a tiny client component that effects `document.documentElement.dataset.theatrics = 'medium'` (or `calm`) on mount, and resets to `full` on unmount. `useTheatrics` in Task 7 subscribes via `MutationObserver`, so downstream primitives react immediately.

Per spec §3.6:
- `(dashboard)` → `medium`
- `(dashboard)/dashboard/chat/**` → `calm`
- `(dashboard)/dashboard/sessions` → `calm`
- `(dashboard)/dashboard/scores` → `calm`
- Everything else → `full` (default from root)

- [ ] **Step 1: Create shared `apps/web/src/components/theatrics-tier.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import type { TheatricsTier } from "@zstar/ui/lib/use-theatrics";

export function TheatricsTier({ tier }: { tier: TheatricsTier }) {
  useEffect(() => {
    const prev = document.documentElement.dataset.theatrics ?? "full";
    document.documentElement.dataset.theatrics = tier;
    return () => {
      document.documentElement.dataset.theatrics = prev;
    };
  }, [tier]);
  return null;
}
```

- [ ] **Step 2: Modify `apps/web/src/app/(dashboard)/layout.tsx`**

Read the existing file first. Add import and mount `<TheatricsTier tier="medium" />` inside the returned JSX (as a sibling to the children, not wrapping).

```tsx
import { TheatricsTier } from "@/components/theatrics-tier";

// ... inside the component's return, as the first child of the existing wrapper:
<TheatricsTier tier="medium" />
{children}
```

- [ ] **Step 3: Create `apps/web/src/app/(dashboard)/dashboard/chat/layout.tsx`** (if missing)

```tsx
import { TheatricsTier } from "@/components/theatrics-tier";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TheatricsTier tier="calm" />
      {children}
    </>
  );
}
```

- [ ] **Step 4: Create `apps/web/src/app/(dashboard)/dashboard/sessions/layout.tsx`** (if missing)

```tsx
import { TheatricsTier } from "@/components/theatrics-tier";

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TheatricsTier tier="calm" />
      {children}
    </>
  );
}
```

- [ ] **Step 5: Create `apps/web/src/app/(dashboard)/dashboard/scores/layout.tsx`** (if missing)

```tsx
import { TheatricsTier } from "@/components/theatrics-tier";

export default function ScoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TheatricsTier tier="calm" />
      {children}
    </>
  );
}
```

If any of these routes already have a `layout.tsx`, add the `<TheatricsTier tier="calm" />` inside the existing return. Do NOT replace the existing layout file.

- [ ] **Step 6: Typecheck**

```bash
cd /Users/possible/Documents/Zstar && pnpm -F @zstar/web exec tsc --noEmit
```

- [ ] **Step 7: Dev-server smoke**

Navigate:
- `/` → cursor visible (full)
- `/dashboard` → cursor visible (medium)
- `/dashboard/chat` (or existing chat route) → cursor NOT visible (calm)

Back-navigate: the cursor should reappear when leaving the calm route.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/theatrics-tier.tsx "apps/web/src/app/(dashboard)"
git commit -m "feat(web): route-group data-theatrics overrides (medium for dashboard, calm for chat/sessions/scores)"
```

---

## Task 12: Barrel Exports + Showcase Updates

**Files:**
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/web/src/app/(showcase)/showcase/page.tsx`

**Context:** Add the new primitives to the `@zstar/ui` barrel and extend the showcase to render every new primitive for visual verification.

- [ ] **Step 1: Append to `packages/ui/src/index.ts`**

Add the new exports (keep existing ones intact):

```ts
// Decorative
export { GradientAccent } from "./decorative/gradient-accent";
export { DotPulse } from "./decorative/dot-pulse";
export { Ticker } from "./decorative/ticker";

// Layout
export { HeroBackdrop } from "./layout/hero-backdrop";
export { NavPill } from "./layout/nav-pill";
export type { NavPillLink } from "./layout/nav-pill";
export { SidebarShell } from "./layout/sidebar-shell";
export { CustomCursor } from "./layout/custom-cursor";

// Kinetic
export { KineticHeadline } from "./kinetic/kinetic-headline";
export { ScrollReveal } from "./kinetic/scroll-reveal";

// Hooks
export { useTheatrics } from "./lib/use-theatrics";
export type { TheatricsTier } from "./lib/use-theatrics";
```

- [ ] **Step 2: Extend `apps/web/src/app/(showcase)/showcase/page.tsx`**

Add new sections for each primitive. The file already starts with `"use client";`. Read the current file, then append these sections above the closing `</main>`:

```tsx
      <section>
        <Eyebrow>05 Decorative</Eyebrow>
        <div className="mt-6 flex items-center gap-6">
          <GradientAccent>Signal coverage</GradientAccent>
          <GradientAccent variant="brand">Score 87</GradientAccent>
          <div className="flex items-center gap-2">
            <DotPulse aria-label="live" />
            <MonoCaption>live</MonoCaption>
          </div>
        </div>
      </section>

      <section>
        <Eyebrow>06 Ticker</Eyebrow>
        <Ticker
          className="mt-6"
          entries={["FOUNDER PROFILING", "DECK EXTRACTION", "MENTOR SESSIONS", "SIGNAL SCORING"]}
        />
      </section>

      <section>
        <Eyebrow>07 Kinetic</Eyebrow>
        <div className="mt-6">
          <KineticHeadline as="h2">Welcome back</KineticHeadline>
        </div>
        <ScrollReveal className="mt-8">
          <HairlineCard>
            <MonoCaption variant="muted">scroll-reveal</MonoCaption>
            <div className="mt-6 font-[family-name:var(--font-display)] text-[22px]">
              Reveals on <em>view</em>
            </div>
          </HairlineCard>
        </ScrollReveal>
      </section>

      <section>
        <Eyebrow>08 HeroBackdrop</Eyebrow>
        <div className="mt-6 h-[200px] relative overflow-hidden">
          <HeroBackdrop vignette className="!min-h-0 h-full">
            <div className="flex h-full items-center justify-center">
              <Display as="h3">
                On <em>aurora</em>
              </Display>
            </div>
          </HeroBackdrop>
        </div>
      </section>

      <section>
        <Eyebrow>09 NavPill (inline preview, not fixed)</Eyebrow>
        <div className="mt-6 relative h-20 bg-[var(--color-bg)]">
          <div className="absolute left-1/2 top-4 -translate-x-1/2">
            <NavPill
              className="!static !translate-x-0"
              logo={<GradientAccent variant="brand" static>ZStar</GradientAccent>}
              activeHref="/product"
              links={[
                { href: "/product", label: "Product" },
                { href: "/pricing", label: "Pricing" },
                { href: "/docs", label: "Docs" },
              ]}
              cta={
                <Chip onClick={() => {}}>
                  Start
                </Chip>
              }
            />
          </div>
        </div>
      </section>
```

Add the corresponding imports at the top (merge into the existing `@zstar/ui` destructure):

```tsx
import {
  Display,
  Eyebrow,
  MonoCaption,
  HairlineCard,
  StatCard,
  Chip,
  GradientAccent,
  DotPulse,
  Ticker,
  HeroBackdrop,
  NavPill,
  KineticHeadline,
  ScrollReveal,
} from "@zstar/ui";
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/possible/Documents/Zstar && pnpm -F @zstar/web exec tsc --noEmit
```

- [ ] **Step 4: Full unit suite**

```bash
cd /Users/possible/Documents/Zstar && pnpm -F @zstar/web test
```

Expected: all prior tests still pass, plus 10 new test files from Phase 2 (gradient-accent, dot-pulse, ticker, hero-backdrop, nav-pill, sidebar-shell, use-theatrics, custom-cursor, kinetic-headline, scroll-reveal). No regressions in Phase 1 suites.

- [ ] **Step 5: Dev-server visual check**

```bash
pnpm -F @zstar/web dev
```

Open `/showcase`. Expected sections 01–09:
- 01–04: unchanged from Phase 1
- 05: gradient accents + pulsing live dot
- 06: scrolling ticker with gradient `—` separators
- 07: "Welcome back" glyph-stagger entrance; the card reveals on scroll (in supporting browsers; Chrome 115+, Safari 17+, Firefox not yet)
- 08: aurora backdrop with vignette behind a gradient-italic "aurora"
- 09: inline NavPill preview with ZStar gradient logo + 3 links + Start chip; hover underline on links; cursor dot follows (tier is still `full`)

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/index.ts "apps/web/src/app/(showcase)/showcase/page.tsx"
git commit -m "feat(ui): Phase 2 barrel exports and showcase sections"
```

---

## Phase 2 Complete — Verification Gate

Before moving to Phase 3 (shell composition — `AppSidebar`, `Shell` route-group selector), confirm:

- [ ] `pnpm -F @zstar/web exec tsc --noEmit` passes
- [ ] `pnpm -F @zstar/web test` passes (all ~33 unit tests green)
- [ ] `/showcase` renders all 9 sections correctly at 1440w in the browser
- [ ] CustomCursor passes gating matrix in manual smoke:
  - visible on `/` (full), `/dashboard` (medium)
  - NOT visible on `/dashboard/chat/*`, `/dashboard/sessions`, `/dashboard/scores` (calm)
  - NOT visible on a touch emulator (Chrome DevTools → Toggle device toolbar → iPhone)
  - NOT visible with `prefers-reduced-motion: reduce` enabled in DevTools → Rendering → Emulate CSS media feature
  - Transparent when hovering over any `<input>`, `<textarea>`, or Clerk `.cl-rootBox` descendant
- [ ] View Transitions: if `unstable_ViewTransition` resolved in Task 10, navigating between routes at tier `full`/`medium` produces a cross-fade rather than a hard cut. If not resolved, no regressions (pass-through).
- [ ] No existing surface broken in a spot check of `/`, `/sign-in`, `/dashboard`, `/dashboard/chat` (or whatever chat routes exist).

When all gates pass, create `docs/superpowers/plans/2026-04-13-full-redesign-phase-3-shell-composition.md` covering:

- `AppSidebar` domain composition wrapping `SidebarShell` with ZStar nav config (Dashboard, Sessions, Scores, Profile, Settings) + gradient avatar user block
- Marketing `MarketingNav` domain composition wrapping `NavPill` with ZStar link config + "Start your profile" CTA
- Route-group `Shell` selector — a single component in `apps/web/src/components/shell.tsx` that picks `AppSidebar`, `MarketingNav`, or minimal presentational shell by route segment
- Footer (marketing) with hairline top, mono section headers, serif wordmark, gradient `—` legal strip
- Breadcrumb component for dashboard top bar
- `CustomCursor` input-hover audit on all existing forms (sign-in, sign-up, onboarding, settings) to confirm Clerk portal descendants trigger `data-hidden="true"`
