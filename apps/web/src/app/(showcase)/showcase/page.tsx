"use client";

import { useState } from "react";
import {
  Display,
  Eyebrow,
  MonoCaption,
  HairlineCard,
  StatCard,
  Chip,
  DotPulse,
  HeroBackdrop,
  NavPill,
  SidebarShell,
  EmptyState,
  LoadingShimmer,
  ErrorPanel,
  KineticHeadline,
  ScrollReveal,
  StreamingReveal,
  ThinkingIndicator,
  MobileNavDrawer,
  ChatComposerShell,
} from "@zstar/ui";

const drawerNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mentor", label: "Mentor" },
  { href: "/signals", label: "Signals" },
  { href: "/settings", label: "Settings" },
];

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing", active: true },
  { href: "/blog", label: "Blog" },
];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-10 mt-2">
      {children}
    </h2>
  );
}

export default function ShowcasePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] px-12 py-16 max-w-5xl mx-auto">
      <div className="mb-16 max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(36px,4vw,60px)] leading-none tracking-[-0.015em] text-[var(--color-text)]">
          Primitives
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-muted)] font-[family-name:var(--font-mono)]">
          Phase 2 design system — 17 composable primitives.
        </p>
      </div>

      {/* ── Typography ─────────────────────────────────────────── */}
      <SectionHeader>Typography</SectionHeader>

      <section className="py-16 space-y-12 max-w-3xl">
        <div>
          <Eyebrow>01 · Display</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Display heading at three scale levels with native italic.
          </p>
          <Display>Build something remarkable</Display>
          <Display as="h2">Signal clarity at scale</Display>
          <Display as="h3">Quiet founders move fast</Display>
        </div>

        <div>
          <Eyebrow>02 · Eyebrow</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Mono uppercase label for section headings.
          </p>
          <Eyebrow>Investor signals</Eyebrow>
        </div>

        <div>
          <Eyebrow>03 · MonoCaption</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Small mono metadata in three tones.
          </p>
          <div className="flex items-center gap-6">
            <MonoCaption>07 / 24</MonoCaption>
            <MonoCaption variant="muted">metadata</MonoCaption>
            <MonoCaption variant="accent">live</MonoCaption>
          </div>
        </div>

        <div>
          <Eyebrow>04 · KineticHeadline</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Animates letter-by-letter (disabled with prefers-reduced-motion or tier=calm).
          </p>
          <KineticHeadline>Build something remarkable</KineticHeadline>
        </div>
      </section>

      {/* ── Surface ────────────────────────────────────────────── */}
      <SectionHeader>Surface</SectionHeader>

      <section className="py-16 space-y-12">
        <div className="max-w-3xl">
          <Eyebrow>05 · HairlineCard</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Hairline-bordered card with optional interactive hover state.
          </p>
          <div className="grid grid-cols-3 gap-px bg-[var(--color-border)]">
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
        </div>

        <div>
          <Eyebrow>06 · StatCard</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Metric tile with animated fill bar. The emphasis variant tints the value.
          </p>
          <div className="grid grid-cols-4 gap-px bg-[var(--color-border)]">
            <StatCard label="Sessions" value="12" fill={0.6} />
            <StatCard label="Coverage" value="78%" fill={0.78} />
            <StatCard label="Signals" value="6 / 8" fill={0.75} />
            <StatCard label="Score" value="87" fill={0.87} emphasis />
          </div>
        </div>

        <div className="max-w-3xl">
          <Eyebrow>07 · Chip</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Inline status tag. Renders as a button when onClick is provided.
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip>live</Chip>
            <Chip>pending</Chip>
            <Chip>processing</Chip>
            <Chip onClick={() => {}}>clickable</Chip>
          </div>
        </div>

        <div className="max-w-3xl">
          <Eyebrow>08 · DotPulse</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Pulsing status dot in three tones and two sizes.
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <DotPulse />
                <MonoCaption variant="muted">brand md</MonoCaption>
              </div>
              <div className="flex items-center gap-2">
                <DotPulse size="sm" />
                <MonoCaption variant="muted">brand sm</MonoCaption>
              </div>
              <div className="flex items-center gap-2">
                <DotPulse tone="neutral" />
                <MonoCaption variant="muted">neutral md</MonoCaption>
              </div>
              <div className="flex items-center gap-2">
                <DotPulse tone="neutral" size="sm" />
                <MonoCaption variant="muted">neutral sm</MonoCaption>
              </div>
              <div className="flex items-center gap-2">
                <DotPulse tone="success" />
                <MonoCaption variant="muted">success md</MonoCaption>
              </div>
              <div className="flex items-center gap-2">
                <DotPulse tone="success" size="sm" />
                <MonoCaption variant="muted">success sm</MonoCaption>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DotPulse tone="brand" label="Streaming indicator" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Shell ──────────────────────────────────────────────── */}
      <SectionHeader>Shell</SectionHeader>

      <section className="py-16 space-y-12">
        <div className="max-w-3xl">
          <Eyebrow>09 · NavPill</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Pill-shaped navigation bar with active item underline.
          </p>
          <NavPill items={navItems} />
        </div>

        <div>
          <Eyebrow>10 · SidebarShell</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Fixed-width sidebar with header, nav, and footer slots. Supports collapsed mode.
          </p>
          <div className="flex h-[400px] overflow-hidden rounded border border-[var(--color-border)]">
            <SidebarShell
              header={
                <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
                  ZStar
                </span>
              }
              nav={
                <nav className="flex flex-col gap-1">
                  {["Dashboard", "Mentor", "Signals", "Settings"].map((item) => (
                    <a
                      key={item}
                      href="#"
                      className="block rounded px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                    >
                      {item}
                    </a>
                  ))}
                </nav>
              }
              footer={
                <span className="text-xs text-[var(--color-text-muted)] font-[family-name:var(--font-mono)]">
                  v0.1.0
                </span>
              }
            />
            <div className="flex-1 bg-[var(--color-bg)] p-6">
              <p className="text-[var(--color-text-muted)] text-sm font-[family-name:var(--font-mono)]">
                main content area
              </p>
            </div>
          </div>
          <div className="mt-4 flex h-[100px] overflow-hidden rounded border border-[var(--color-border)]">
            <SidebarShell collapsed nav={<div className="flex flex-col gap-2 items-center" />} />
            <div className="flex-1 bg-[var(--color-bg)] p-4 flex items-center">
              <p className="text-[var(--color-text-muted)] text-xs font-[family-name:var(--font-mono)]">
                collapsed — w-16
              </p>
            </div>
          </div>
        </div>

        <div>
          <Eyebrow>11 · HeroBackdrop</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Aurora background with two intensity levels.
          </p>
          <div className="relative h-[400px] overflow-hidden rounded border border-[var(--color-border)]">
            <HeroBackdrop className="h-full">
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <h1 className="font-[family-name:var(--font-display)] text-[48px] text-[var(--color-text)]">
                  Build something remarkable
                </h1>
                <p className="text-[var(--color-text-muted)] text-sm font-[family-name:var(--font-mono)]">
                  intensity: full (default)
                </p>
              </div>
            </HeroBackdrop>
          </div>
          <div className="mt-4 relative h-[200px] overflow-hidden rounded border border-[var(--color-border)]">
            <HeroBackdrop intensity="soft" className="h-full">
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-[var(--color-text-muted)] text-sm font-[family-name:var(--font-mono)]">
                  intensity: soft — aurora + overlay at 60% opacity
                </p>
              </div>
            </HeroBackdrop>
          </div>
        </div>

        <div className="max-w-3xl">
          <Eyebrow>12 · MobileNavDrawer</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Vaul bottom-sheet drawer, 80vh, rounded top corners.
          </p>
          <MobileNavDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            trigger={
              <button className="rounded-full border border-[var(--color-border-interactive)] px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-[var(--color-text)]">
                Open menu
              </button>
            }
            title="Navigation"
          >
            <nav className="flex flex-col gap-1 mt-2">
              {drawerNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block rounded px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </MobileNavDrawer>
        </div>

        <div className="max-w-3xl">
          <Eyebrow>13 · ChatComposerShell</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Sticky chat input bar with left, center, and right slots.
          </p>
          <div className="relative rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] h-[200px] overflow-hidden">
            <div className="p-6">
              <p className="text-[var(--color-text-muted)] text-sm font-[family-name:var(--font-mono)]">
                chat content area
              </p>
            </div>
            <ChatComposerShell
              left={
                <button className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                  +
                </button>
              }
              input={
                <textarea
                  rows={1}
                  placeholder="Message your mentor..."
                  className="w-full resize-none rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-border-interactive)]"
                />
              }
              right={
                <button className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-xs font-medium text-white">
                  Send
                </button>
              }
            />
          </div>
        </div>
      </section>

      {/* ── State ──────────────────────────────────────────────── */}
      <SectionHeader>State</SectionHeader>

      <section className="py-16 space-y-12 max-w-3xl">
        <div>
          <Eyebrow>14 · EmptyState</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Blank-slate placeholder with optional eyebrow, body, and action slot.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <EmptyState
                eyebrow="Mentor"
                title="No threads yet"
                body={<p>Start your first conversation with your AI mentor.</p>}
                action={
                  <button className="rounded-full border border-[var(--color-border-interactive)] px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-[var(--color-text)]">
                    Start a thread
                  </button>
                }
              />
            </div>
            <div className="rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <EmptyState title="Nothing here" />
            </div>
          </div>
        </div>

        <div>
          <Eyebrow>15 · LoadingShimmer</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Skeleton placeholder block in any size or border-radius.
          </p>
          <div className="space-y-3 max-w-sm">
            <LoadingShimmer height="1rem" />
            <LoadingShimmer height="1rem" width="70%" />
            <LoadingShimmer height="1rem" width="50%" />
            <LoadingShimmer height="3rem" rounded="md" />
            <LoadingShimmer height="2rem" width="2rem" rounded="full" />
          </div>
        </div>

        <div>
          <Eyebrow>16 · ErrorPanel</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Error boundary panel with optional retry action.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <ErrorPanel
              title="Failed to load signals"
              detail={<p>Check your connection and try again.</p>}
              retry={() => {}}
            />
            <ErrorPanel
              title="Session expired"
              detail={<p>Your session has timed out.</p>}
              retry={() => {}}
              retryLabel="Sign in again"
            />
            <ErrorPanel title="No retry variant" detail={<p>This panel has no retry action.</p>} />
          </div>
        </div>
      </section>

      {/* ── Motion ─────────────────────────────────────────────── */}
      <SectionHeader>Motion</SectionHeader>

      <section className="py-16 space-y-12">
        <div className="max-w-xl">
          <Eyebrow>17 · ScrollReveal</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Scroll-driven entrance animation using animation-timeline: view().
          </p>
          <div className="space-y-6">
            {["First item — scroll to see", "Second item", "Third item"].map((text, i) => (
              <ScrollReveal key={i} as="section">
                <HairlineCard>
                  <MonoCaption variant="muted">0{i + 1}</MonoCaption>
                  <div className="mt-4 font-[family-name:var(--font-display)] text-[20px]">{text}</div>
                </HairlineCard>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div className="max-w-xl">
          <Eyebrow>18 · StreamingReveal</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Character-by-character text reveal, mimicking LLM streaming output.
          </p>
          <div className="space-y-4">
            <HairlineCard>
              <MonoCaption variant="muted" className="mb-3">Animated (reduced-motion off)</MonoCaption>
              <p className="text-[var(--color-text)] leading-relaxed">
                <StreamingReveal text="Your pitch deck has strong market sizing but the go-to-market strategy needs more specificity around customer acquisition channels." />
              </p>
            </HairlineCard>
            <HairlineCard>
              <MonoCaption variant="muted" className="mb-3">Static mode — plain render</MonoCaption>
              <p className="text-[var(--color-text)] leading-relaxed">
                <StreamingReveal staticMode text="Stream complete — no re-animation on this text." />
              </p>
            </HairlineCard>
          </div>
        </div>

        <div className="max-w-3xl">
          <Eyebrow>19 · ThinkingIndicator</Eyebrow>
          <p className="mt-1 mb-6 text-sm text-[var(--color-text-muted)]">
            Animated dot trio with accessible role=status and a visible label.
          </p>
          <div className="flex items-center gap-8">
            <ThinkingIndicator />
            <ThinkingIndicator label="Analyzing signals" />
          </div>
        </div>
      </section>
    </main>
  );
}
