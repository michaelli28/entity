# Full Redesign — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the editorial design foundation — tokens, fonts, motion primitives, and the first wave of reusable primitives — so subsequent phases can compose surfaces from a finished system.

**Architecture:** Tokens-first in `packages/ui` using Tailwind 4 `@theme` blocks; fonts via `next/font/google` with trimmed weights and `adjustFontFallback`; primitives as typed React components exported from `@zstar/ui`. Unit tests live in `apps/web/src/__tests__/ui/` using the existing Vitest setup (packages/ui has no vitest of its own).

**Tech Stack:** Tailwind 4 CSS-first config, `next/font/google`, React 19, TypeScript strict, Vitest + React Testing Library + jsdom, Playwright for visual smoke.

**Scope for this phase:**
- Replace current oklch tokens with editorial hex/gradient tokens
- Migrate from CSS-declared fonts to `next/font` (DM Serif Display, Syne, JetBrains Mono)
- Reduced-motion hook
- Typographic primitives: `Display`, `Eyebrow`, `MonoCaption`
- Surface primitives: `HairlineCard`, `StatCard`, `Chip`
- Export barrel + primitive showcase route for visual verification

**Deferred to later phases:**
- Layout primitives (`SidebarShell`, `NavPill`, `CustomCursor`) — Phase 2
- Kinetic primitives (`KineticHeadline`, `ScrollReveal`, `Ticker`, View Transitions) — Phase 2
- Shell composition + route layouts — Phase 3
- Per-surface redesigns (marketing, auth, dashboard, presentational) — Phase 4+
- Clerk headless migration — Phase 4 (auth phase)

**Important:** `apps/web/AGENTS.md` warns that this Next.js has breaking changes from training data. Before writing `next/font` or View Transitions code, check `node_modules/next/dist/docs/`.

**Spec reference:** `docs/superpowers/specs/2026-04-12-full-redesign-design.md`

---

## File Structure

### Created

- `packages/ui/src/styles/tokens.css` — editorial design tokens (`@theme` block)
- `packages/ui/src/hooks/use-reduced-motion.ts` — media query hook
- `packages/ui/src/typographic/display.tsx` — serif display headline with auto-gradient `<em>`
- `packages/ui/src/typographic/eyebrow.tsx` — mono uppercase label with leading bar
- `packages/ui/src/typographic/mono-caption.tsx` — mono caption text
- `packages/ui/src/surface/hairline-card.tsx` — black card with hairline border
- `packages/ui/src/surface/stat-card.tsx` — label + serif value + animated fill bar
- `packages/ui/src/surface/chip.tsx` — mono text chip
- `packages/ui/src/lib/cn.ts` — `clsx` + `tailwind-merge` helper (if not already present)
- `apps/web/src/app/(showcase)/_showcase/page.tsx` — primitive showcase for visual verification
- `apps/web/src/__tests__/ui/display.test.tsx`
- `apps/web/src/__tests__/ui/eyebrow.test.tsx`
- `apps/web/src/__tests__/ui/mono-caption.test.tsx`
- `apps/web/src/__tests__/ui/hairline-card.test.tsx`
- `apps/web/src/__tests__/ui/stat-card.test.tsx`
- `apps/web/src/__tests__/ui/chip.test.tsx`
- `apps/web/src/__tests__/ui/use-reduced-motion.test.ts`

### Modified

- `apps/web/src/app/globals.css` — replace oklch tokens with editorial tokens; import `@zstar/ui/styles/tokens.css`
- `apps/web/src/app/layout.tsx` — migrate to `next/font/google` with trimmed weights and fallback adjustment
- `packages/ui/src/index.ts` — barrel export for new primitives (create if missing)
- `packages/ui/package.json` — add `"./styles/tokens.css"` to `exports` map

---

## Testing Conventions

- Unit tests run via `pnpm -F @zstar/web test` (existing vitest config in `apps/web`)
- Type check: `pnpm -w typecheck`
- All tests use Testing Library; no shallow rendering
- Each primitive test covers: (a) renders children, (b) applies variant-distinguishing class or aria, (c) one behavior specific to the primitive (e.g., `Display` auto-wraps `<em>` with gradient class)

---

## Task 1: Editorial Design Tokens (replaces oklch)

**Files:**
- Create: `packages/ui/src/styles/tokens.css`
- Modify: `apps/web/src/app/globals.css` (full replacement of current `@theme` block)
- Modify: `packages/ui/package.json` (add styles export)

**Context:** The current `globals.css` declares oklch-based tokens and inline font-family strings. We replace with hex/rgba editorial tokens moved into `packages/ui/src/styles/tokens.css` so other apps/packages can reuse them.

- [ ] **Step 1: Create `packages/ui/src/styles/tokens.css`**

```css
@theme {
  /* Surface */
  --color-bg: #000000;
  --color-text: #f4f2ff;
  --color-muted: rgba(244, 242, 255, 0.42);
  --color-border: rgba(255, 255, 255, 0.07);
  --color-border-interactive: rgba(255, 255, 255, 0.18);

  /* Brand ramp */
  --color-brand-purple: #7c3aed;
  --color-brand-indigo: #4f46e5;
  --color-brand-blue: #2563eb;
  --color-brand-purple-light: #a78bfa;
  --color-brand-indigo-light: #818cf8;
  --color-brand-blue-light: #60a5fa;

  /* Gradients */
  --gradient-brand: linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb);
  --gradient-flow: linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa, #7c3aed);

  /* Fonts — family strings only; weights are loaded via next/font */
  --font-display: "DM Serif Display", Georgia, serif;
  --font-sans: "Syne", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Motion */
  --motion-gradient-duration: 5s;
  --motion-hover-color: 200ms;
  --motion-hover-fill: 400ms;
}

@keyframes zstar-gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes zstar-gradient-shift {
    0%, 100% { background-position: 0% 50%; }
  }
}
```

- [ ] **Step 2: Update `packages/ui/package.json` exports**

Add the styles path to the `exports` map:

```json
{
  "name": "@zstar/ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./styles/tokens.css": "./src/styles/tokens.css",
    "./*": {
      "types": "./src/*.tsx",
      "default": "./src/*.tsx"
    }
  },
  ...
}
```

- [ ] **Step 3: Replace `apps/web/src/app/globals.css`**

```css
@import "tailwindcss";
@import "@zstar/ui/styles/tokens.css";

@source "../../../../packages/ui/src/**/*.{ts,tsx}";

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm -w typecheck
```

Expected: PASS (no existing code should depend on the removed oklch tokens; `bg-background` / `text-foreground` classes will fail if anything used them — if so, Step 5 fixes it).

- [ ] **Step 5: If typecheck/build surfaces stale `bg-background` / `text-foreground` references, replace them**

Search and replace in `apps/web`:

```bash
grep -rn "bg-background\|text-foreground\|bg-card\|text-muted-foreground" apps/web/src
```

For each hit: replace `bg-background` → `bg-[var(--color-bg)]`, `text-foreground` → `text-[var(--color-text)]`, `text-muted-foreground` → `text-[var(--color-muted)]`. These are stopgaps; Phase 3 will replace them with utility shortcuts.

- [ ] **Step 6: Verify in browser**

```bash
pnpm -F @zstar/web dev
```

Navigate to any existing page. Expected: page renders on pure black with off-white text (no visual regression beyond the color swap).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/styles/tokens.css packages/ui/package.json apps/web/src/app/globals.css
# plus any files touched in Step 5
git commit -m "feat(ui): editorial design tokens in packages/ui, imported via globals.css"
```

---

## Task 2: Migrate Fonts to next/font

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

**Context:** Current layout does not declare fonts via `next/font`; fonts are referenced by family name only. We migrate to `next/font/google` with trimmed weights and `adjustFontFallback` to mitigate CLS on 100px serif hero headlines.

**Before writing, check:** `node_modules/next/dist/docs/` for current `next/font` API (per `apps/web/AGENTS.md`).

- [ ] **Step 1: Write font setup in `apps/web/src/app/layout.tsx`**

Replace the file with:

```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { DM_Serif_Display, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";

const fontDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  preload: true,
});

const fontSans = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-sans-loaded",
  display: "swap",
  preload: true,
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono-loaded",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ZStar",
  description: "AI-powered founder profiling and deal flow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html
        lang="en"
        className={`dark ${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      >
        <body className="antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Update `tokens.css` to prefer the loaded font variables**

In `packages/ui/src/styles/tokens.css`, change the font entries inside `@theme`:

```css
  --font-display: var(--font-display-loaded, "DM Serif Display"), Georgia, serif;
  --font-sans: var(--font-sans-loaded, "Syne"), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono-loaded, "JetBrains Mono"), ui-monospace, monospace;
```

- [ ] **Step 3: Run dev server and verify fonts load**

```bash
pnpm -F @zstar/web dev
```

Open DevTools > Network > filter by "font". Expected: `dm-serif-display-latin-400-*.woff2`, `syne-latin-*.woff2`, `jetbrains-mono-latin-400-*.woff2`. No external fetches to fonts.googleapis.com.

- [ ] **Step 4: Run typecheck**

```bash
pnpm -w typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/layout.tsx packages/ui/src/styles/tokens.css
git commit -m "feat(web): migrate fonts to next/font with trimmed weights and serif fallback"
```

---

## Task 3: `useReducedMotion` Hook

**Files:**
- Create: `packages/ui/src/hooks/use-reduced-motion.ts`
- Create: `apps/web/src/__tests__/ui/use-reduced-motion.test.ts`

**Context:** Multiple primitives need to gate animation on `prefers-reduced-motion`. Centralize in one hook.

- [ ] **Step 1: Write failing test**

Create `apps/web/src/__tests__/ui/use-reduced-motion.test.ts`:

```ts
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReducedMotion } from "@zstar/ui/hooks/use-reduced-motion";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("useReducedMotion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when user has no motion preference", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when user prefers reduced motion", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm -F @zstar/web test -- use-reduced-motion
```

Expected: FAIL — module `@zstar/ui/hooks/use-reduced-motion` not found.

- [ ] **Step 3: Write minimal implementation**

Create `packages/ui/src/hooks/use-reduced-motion.ts`:

```ts
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm -F @zstar/web test -- use-reduced-motion
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/hooks/use-reduced-motion.ts apps/web/src/__tests__/ui/use-reduced-motion.test.ts
git commit -m "feat(ui): add useReducedMotion hook in packages/ui"
```

---

## Task 4: `Display` Primitive (auto-gradient `<em>`)

**Files:**
- Create: `packages/ui/src/lib/cn.ts` (if not present)
- Create: `packages/ui/src/typographic/display.tsx`
- Create: `apps/web/src/__tests__/ui/display.test.tsx`

**Context:** Serif display headline. Children can include `<em>` which automatically renders with the animated gradient flow.

- [ ] **Step 1: Ensure `cn` helper exists**

Check if `packages/ui/src/lib/cn.ts` exists. If not, create:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Write failing test**

Create `apps/web/src/__tests__/ui/display.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Display } from "@zstar/ui/typographic/display";

describe("Display", () => {
  it("renders children as h1 by default", () => {
    render(<Display>Hello</Display>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello");
  });

  it("renders as configured level when `as` prop set", () => {
    render(<Display as="h2">Sub</Display>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sub");
  });

  it("applies the gradient flow class to <em> children", () => {
    const { container } = render(
      <Display>
        Welcome <em>back</em>
      </Display>
    );
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(em?.className).toContain("zstar-gradient-em");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm -F @zstar/web test -- display
```

Expected: FAIL — `Display` not found.

- [ ] **Step 4: Write implementation**

Create `packages/ui/src/typographic/display.tsx`:

```tsx
import * as React from "react";
import { cn } from "../lib/cn";

type DisplayLevel = "h1" | "h2" | "h3";

interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: DisplayLevel;
  children: React.ReactNode;
}

const sizeByLevel: Record<DisplayLevel, string> = {
  h1: "text-[clamp(52px,6.5vw,100px)] leading-[0.95] tracking-[-0.03em]",
  h2: "text-[clamp(36px,4vw,60px)] leading-none tracking-[-0.015em]",
  h3: "text-[clamp(28px,3vw,44px)] leading-tight tracking-[-0.01em]",
};

function wrapEmWithGradient(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === "em") {
      const existing = (child.props as { className?: string }).className ?? "";
      return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
        className: cn(existing, "zstar-gradient-em not-italic italic"),
      });
    }
    const childProps = child.props as { children?: React.ReactNode };
    if (childProps.children != null) {
      return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {
        children: wrapEmWithGradient(childProps.children),
      });
    }
    return child;
  });
}

export function Display({ as = "h1", className, children, ...rest }: DisplayProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        "font-[family-name:var(--font-display)] text-[var(--color-text)]",
        sizeByLevel[as],
        className,
      )}
      {...rest}
    >
      {wrapEmWithGradient(children)}
    </Tag>
  );
}
```

- [ ] **Step 5: Add the gradient-em class to `tokens.css`**

Append to `packages/ui/src/styles/tokens.css` (outside `@theme`):

```css
.zstar-gradient-em {
  background: var(--gradient-flow);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: zstar-gradient-shift var(--motion-gradient-duration) ease infinite;
  font-style: italic;
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
pnpm -F @zstar/web test -- display
```

Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/lib/cn.ts packages/ui/src/typographic/display.tsx \
  packages/ui/src/styles/tokens.css apps/web/src/__tests__/ui/display.test.tsx
git commit -m "feat(ui): Display primitive with auto-gradient italic em"
```

---

## Task 5: `Eyebrow` Primitive

**Files:**
- Create: `packages/ui/src/typographic/eyebrow.tsx`
- Create: `apps/web/src/__tests__/ui/eyebrow.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Eyebrow } from "@zstar/ui/typographic/eyebrow";

describe("Eyebrow", () => {
  it("renders uppercase mono text", () => {
    render(<Eyebrow>Workspace</Eyebrow>);
    const el = screen.getByText("Workspace");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("font-[family-name:var(--font-mono)]");
  });

  it("renders a leading hairline bar as sibling", () => {
    const { container } = render(<Eyebrow>Signals</Eyebrow>);
    const bar = container.querySelector("[data-eyebrow-bar]");
    expect(bar).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module not found)**

```bash
pnpm -F @zstar/web test -- eyebrow
```

- [ ] **Step 3: Write implementation**

Create `packages/ui/src/typographic/eyebrow.tsx`:

```tsx
import * as React from "react";
import { cn } from "../lib/cn";

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[10px] text-[11px] font-bold tracking-[0.14em] uppercase",
        "font-[family-name:var(--font-mono)]",
        className,
      )}
      {...rest}
    >
      <span
        data-eyebrow-bar
        aria-hidden="true"
        className="h-px w-6 bg-[var(--color-brand-purple)]"
      />
      <span
        className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent"
      >
        {children}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm -F @zstar/web test -- eyebrow
```

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/typographic/eyebrow.tsx apps/web/src/__tests__/ui/eyebrow.test.tsx
git commit -m "feat(ui): Eyebrow primitive"
```

---

## Task 6: `MonoCaption` Primitive

**Files:**
- Create: `packages/ui/src/typographic/mono-caption.tsx`
- Create: `apps/web/src/__tests__/ui/mono-caption.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MonoCaption } from "@zstar/ui/typographic/mono-caption";

describe("MonoCaption", () => {
  it("renders mono text with letter-spacing", () => {
    render(<MonoCaption>07 / 24</MonoCaption>);
    const el = screen.getByText("07 / 24");
    expect(el.className).toContain("font-[family-name:var(--font-mono)]");
    expect(el.className).toContain("tracking-");
  });

  it("accepts muted variant", () => {
    render(<MonoCaption variant="muted">meta</MonoCaption>);
    const el = screen.getByText("meta");
    expect(el.className).toContain("text-[var(--color-muted)]");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Write implementation**

Create `packages/ui/src/typographic/mono-caption.tsx`:

```tsx
import * as React from "react";
import { cn } from "../lib/cn";

interface MonoCaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "muted" | "accent";
  children: React.ReactNode;
}

const variantClasses: Record<NonNullable<MonoCaptionProps["variant"]>, string> = {
  default: "text-[var(--color-text)]",
  muted: "text-[var(--color-muted)]",
  accent: "text-[var(--color-brand-purple-light)]",
};

export function MonoCaption({
  variant = "default",
  className,
  children,
  ...rest
}: MonoCaptionProps) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-mono)] text-[12px] tracking-[0.06em]",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/typographic/mono-caption.tsx apps/web/src/__tests__/ui/mono-caption.test.tsx
git commit -m "feat(ui): MonoCaption primitive"
```

---

## Task 7: `HairlineCard` Primitive

**Files:**
- Create: `packages/ui/src/surface/hairline-card.tsx`
- Create: `apps/web/src/__tests__/ui/hairline-card.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HairlineCard } from "@zstar/ui/surface/hairline-card";

describe("HairlineCard", () => {
  it("renders children", () => {
    render(<HairlineCard>Inside</HairlineCard>);
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("applies hairline border class", () => {
    const { container } = render(<HairlineCard>x</HairlineCard>);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("border");
    expect(root.className).toContain("border-[var(--color-border)]");
  });

  it("renders hover underline when interactive prop is true", () => {
    const { container } = render(<HairlineCard interactive>x</HairlineCard>);
    const underline = container.querySelector("[data-hover-underline]");
    expect(underline).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Write implementation**

Create `packages/ui/src/surface/hairline-card.tsx`:

```tsx
import * as React from "react";
import { cn } from "../lib/cn";

interface HairlineCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export function HairlineCard({
  interactive = false,
  className,
  children,
  ...rest
}: HairlineCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]",
        "p-8",
        interactive && "group transition-colors duration-200 hover:bg-[color:rgba(124,58,237,0.04)]",
        className,
      )}
      {...rest}
    >
      {children}
      {interactive && (
        <span
          data-hover-underline
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 bg-[image:var(--gradient-brand)] transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-full"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/surface/hairline-card.tsx apps/web/src/__tests__/ui/hairline-card.test.tsx
git commit -m "feat(ui): HairlineCard primitive"
```

---

## Task 8: `StatCard` Primitive (animated fill bar)

**Files:**
- Create: `packages/ui/src/surface/stat-card.tsx`
- Create: `apps/web/src/__tests__/ui/stat-card.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "@zstar/ui/surface/stat-card";

describe("StatCard", () => {
  it("renders label, value, and fill bar", () => {
    render(<StatCard label="Sessions" value="12" fill={0.75} />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    const bar = screen.getByTestId("stat-fill");
    expect(bar.style.getPropertyValue("--w")).toBe("75%");
  });

  it("clamps fill to 0..1", () => {
    render(<StatCard label="x" value="1" fill={1.5} />);
    expect(screen.getByTestId("stat-fill").style.getPropertyValue("--w")).toBe("100%");
  });

  it("applies gradient class when `emphasis` is set", () => {
    render(<StatCard label="Score" value="87" emphasis fill={0.5} />);
    const value = screen.getByText("87");
    expect(value.className).toContain("bg-[image:var(--gradient-flow)]");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Write implementation**

Create `packages/ui/src/surface/stat-card.tsx`:

```tsx
import * as React from "react";
import { cn } from "../lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  fill: number;
  emphasis?: boolean;
  className?: string;
}

export function StatCard({ label, value, fill, emphasis = false, className }: StatCardProps) {
  const clamped = Math.max(0, Math.min(1, fill));
  const widthPercent = `${Math.round(clamped * 100)}%`;

  return (
    <div className={cn("bg-[var(--color-bg)] border border-[var(--color-border)] p-6", className)}>
      <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--color-muted)] font-[family-name:var(--font-mono)] mb-3">
        {label}
      </div>
      <div
        className={cn(
          "font-[family-name:var(--font-display)] text-[40px] leading-none text-[var(--color-text)]",
          emphasis &&
            "bg-[image:var(--gradient-flow)] bg-[size:300%_300%] bg-clip-text text-transparent",
        )}
      >
        {value}
      </div>
      <div className="mt-3 h-0.5 bg-[rgba(255,255,255,0.06)] relative overflow-hidden">
        <div
          data-testid="stat-fill"
          style={{ "--w": widthPercent } as React.CSSProperties}
          className="absolute top-0 left-0 h-full bg-[image:var(--gradient-brand)] bg-[size:200%_200%] w-[var(--w)] transition-[width] duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/surface/stat-card.tsx apps/web/src/__tests__/ui/stat-card.test.tsx
git commit -m "feat(ui): StatCard primitive with animated fill bar"
```

---

## Task 9: `Chip` Primitive

**Files:**
- Create: `packages/ui/src/surface/chip.tsx`
- Create: `apps/web/src/__tests__/ui/chip.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Chip } from "@zstar/ui/surface/chip";

describe("Chip", () => {
  it("renders as span by default", () => {
    const { container } = render(<Chip>live</Chip>);
    expect(container.firstChild?.nodeName).toBe("SPAN");
    expect(screen.getByText("live")).toBeInTheDocument();
  });

  it("renders as button when onClick is passed", () => {
    const { container } = render(<Chip onClick={() => {}}>click</Chip>);
    expect(container.firstChild?.nodeName).toBe("BUTTON");
  });

  it("applies mono font and hairline border", () => {
    const { container } = render(<Chip>x</Chip>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("font-[family-name:var(--font-mono)]");
    expect(el.className).toContain("border-[var(--color-border-interactive)]");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Write implementation**

Create `packages/ui/src/surface/chip.tsx`:

```tsx
import * as React from "react";
import { cn } from "../lib/cn";

type ChipBaseProps = {
  className?: string;
  children: React.ReactNode;
};

type ChipStaticProps = ChipBaseProps & React.HTMLAttributes<HTMLSpanElement> & {
  onClick?: never;
};

type ChipButtonProps = ChipBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
};

type ChipProps = ChipStaticProps | ChipButtonProps;

const chipClasses = cn(
  "inline-flex items-center px-3 py-1.5",
  "bg-[var(--color-bg)] border border-[var(--color-border-interactive)]",
  "text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]",
  "transition-colors duration-200 hover:border-[color:rgba(124,58,237,0.5)] hover:text-[var(--color-brand-purple-light)]",
);

export function Chip(props: ChipProps) {
  if ("onClick" in props && props.onClick) {
    const { className, children, onClick, ...rest } = props;
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(chipClasses, "cursor-pointer", className)}
        {...rest}
      >
        {children}
      </button>
    );
  }
  const { className, children, ...rest } = props as ChipStaticProps;
  return (
    <span className={cn(chipClasses, className)} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/surface/chip.tsx apps/web/src/__tests__/ui/chip.test.tsx
git commit -m "feat(ui): Chip primitive (span or button)"
```

---

## Task 10: Barrel Exports + Primitive Showcase Route

**Files:**
- Create (or modify): `packages/ui/src/index.ts`
- Create: `apps/web/src/app/(showcase)/_showcase/page.tsx`

**Context:** Consolidate primitive exports; add a dev-only route that renders every primitive so Playwright and a human can visually verify them.

- [ ] **Step 1: Create or update `packages/ui/src/index.ts`**

```ts
// Typographic
export { Display } from "./typographic/display";
export { Eyebrow } from "./typographic/eyebrow";
export { MonoCaption } from "./typographic/mono-caption";

// Surface
export { HairlineCard } from "./surface/hairline-card";
export { StatCard } from "./surface/stat-card";
export { Chip } from "./surface/chip";

// Hooks
export { useReducedMotion } from "./hooks/use-reduced-motion";

// Utilities
export { cn } from "./lib/cn";
```

- [ ] **Step 2: Create showcase page**

Create `apps/web/src/app/(showcase)/_showcase/page.tsx`:

```tsx
import {
  Display,
  Eyebrow,
  MonoCaption,
  HairlineCard,
  StatCard,
  Chip,
} from "@zstar/ui";

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] p-12 space-y-16">
      <section>
        <Eyebrow>01 Typographic</Eyebrow>
        <Display>
          Welcome <em>back</em>
        </Display>
        <Display as="h2">
          A second <em>headline</em>
        </Display>
        <div className="mt-6">
          <MonoCaption>07 / 24</MonoCaption>
          <span className="mx-3" />
          <MonoCaption variant="muted">metadata</MonoCaption>
          <span className="mx-3" />
          <MonoCaption variant="accent">live</MonoCaption>
        </div>
      </section>

      <section>
        <Eyebrow>02 Surface</Eyebrow>
        <div className="grid grid-cols-3 gap-px mt-6 bg-[var(--color-border)]">
          <HairlineCard interactive>
            <MonoCaption variant="muted">01</MonoCaption>
            <div className="mt-6 font-[family-name:var(--font-display)] text-[22px]">
              Signal <em>coverage</em>
            </div>
          </HairlineCard>
          <HairlineCard interactive>
            <MonoCaption variant="muted">02</MonoCaption>
            <div className="mt-6 font-[family-name:var(--font-display)] text-[22px]">
              Deck <em>extraction</em>
            </div>
          </HairlineCard>
          <HairlineCard interactive>
            <MonoCaption variant="muted">03</MonoCaption>
            <div className="mt-6 font-[family-name:var(--font-display)] text-[22px]">
              Scoring <em>pipeline</em>
            </div>
          </HairlineCard>
        </div>
      </section>

      <section>
        <Eyebrow>03 StatCard</Eyebrow>
        <div className="grid grid-cols-4 gap-px mt-6 bg-[var(--color-border)]">
          <StatCard label="Sessions" value="12" fill={0.6} />
          <StatCard label="Coverage" value="78%" fill={0.78} />
          <StatCard label="Signals" value="6 / 8" fill={0.75} />
          <StatCard label="Score" value="87" fill={0.87} emphasis />
        </div>
      </section>

      <section>
        <Eyebrow>04 Chips</Eyebrow>
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip>live</Chip>
          <Chip>pending</Chip>
          <Chip>processing</Chip>
          <Chip onClick={() => {}}>clickable</Chip>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm -w typecheck
```

Expected: PASS.

- [ ] **Step 4: Run dev server and visually verify**

```bash
pnpm -F @zstar/web dev
```

Navigate to `http://localhost:3000/_showcase`. Expected:
- Serif italic "back" / "headline" / "extraction" / etc. render with animated purple-blue gradient
- Uppercase mono eyebrow labels with leading gradient bar
- Three hairline cards in a grid with 1px gaps showing border seams
- Four stat cards with animated gradient fill bars; the `emphasis` one has gradient numerals
- Chips show mono text with hover border color change

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
pnpm -F @zstar/web test
```

Expected: all prior tests still pass.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/index.ts apps/web/src/app/\(showcase\)/_showcase/page.tsx
git commit -m "feat(ui): barrel exports and primitive showcase route for Phase 1"
```

---

## Phase 1 Complete — Verification Gate

Before moving to Phase 2 (layout + kinetic primitives), confirm:

- [ ] `pnpm -w typecheck` passes
- [ ] `pnpm -F @zstar/web test` passes (all unit tests green)
- [ ] `/_showcase` renders correctly in the browser at 1440w
- [ ] No existing surface is visually broken (spot-check `/sign-in`, `/dashboard`, `/`)
- [ ] No external Google Fonts network requests in DevTools (only local `next/font` assets)
- [ ] Hex editorial tokens fully replace oklch tokens; no `bg-background`/`text-foreground` references remain outside deliberate escape hatches

When all gates pass, create `docs/superpowers/plans/2026-04-12-full-redesign-phase-2-shell-and-motion.md` covering: `SidebarShell`, `NavPill`, `CustomCursor` with gating matrix, `Ticker`, `GradientAccent`, `DotPulse`, `HeroBackdrop`, `KineticHeadline`, `ScrollReveal`, View Transitions wiring, and `data-theatrics` attribute on `<html>` by route group.
