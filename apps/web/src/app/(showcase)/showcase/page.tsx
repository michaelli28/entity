"use client";

import {
  Display,
  Eyebrow,
  MonoCaption,
  HairlineCard,
  StatCard,
  Chip,
  GradientAccent,
  DotPulse,
  HeroBackdrop,
  NavPill,
  SidebarShell,
  EmptyState,
  LoadingShimmer,
  ErrorPanel,
} from "@zstar/ui";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing", active: true },
  { href: "/blog", label: "Blog" },
];

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

      <section>
        <Eyebrow>05 GradientAccent</Eyebrow>
        <div className="mt-6 space-y-4">
          <p className="font-[family-name:var(--font-display)] text-[28px]">
            Build something <GradientAccent>remarkable</GradientAccent>
          </p>
          <p className="font-[family-name:var(--font-display)] text-[28px]">
            Your pitch, <GradientAccent as="em">perfected</GradientAccent>
          </p>
          <p className="font-[family-name:var(--font-display)] text-[28px]">
            Signal <GradientAccent as="strong">clarity</GradientAccent> at every stage
          </p>
        </div>
      </section>

      <section>
        <Eyebrow>06 HeroBackdrop</Eyebrow>
        <div className="mt-6 relative h-[400px] overflow-hidden rounded border border-[var(--color-border)]">
          <HeroBackdrop className="h-full">
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <h1 className="font-[family-name:var(--font-display)] text-[48px] text-[var(--color-text)]">
                Build something <GradientAccent>remarkable</GradientAccent>
              </h1>
              <p className="text-[var(--color-text-muted)] text-sm font-[family-name:var(--font-mono)]">
                intensity=&quot;full&quot; (default)
              </p>
            </div>
          </HeroBackdrop>
        </div>
        <div className="mt-4 relative h-[200px] overflow-hidden rounded border border-[var(--color-border)]">
          <HeroBackdrop intensity="soft" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-[var(--color-text-muted)] text-sm font-[family-name:var(--font-mono)]">
                intensity=&quot;soft&quot; — aurora + overlay at 60% opacity
              </p>
            </div>
          </HeroBackdrop>
        </div>
      </section>

      <section>
        <Eyebrow>07 NavPill</Eyebrow>
        <div className="mt-6 flex flex-col gap-4 items-start">
          <NavPill items={navItems} />
          <p className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">
            &quot;Pricing&quot; marked active — gradient underline + bg-elevated treatment
          </p>
        </div>
      </section>

      <section>
        <Eyebrow>08 SidebarShell</Eyebrow>
        <div className="mt-6 flex h-[400px] overflow-hidden rounded border border-[var(--color-border)]">
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
              collapsed=true — w-16
            </p>
          </div>
        </div>
      </section>

      <section>
        <Eyebrow>09 EmptyState</Eyebrow>
        <div className="mt-6 grid grid-cols-2 gap-4">
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
      </section>

      <section>
        <Eyebrow>10 LoadingShimmer</Eyebrow>
        <div className="mt-6 space-y-3 max-w-sm">
          <LoadingShimmer height="1rem" />
          <LoadingShimmer height="1rem" width="70%" />
          <LoadingShimmer height="1rem" width="50%" />
          <LoadingShimmer height="3rem" rounded="md" />
          <LoadingShimmer height="2rem" width="2rem" rounded="full" />
        </div>
      </section>

      <section>
        <Eyebrow>11 ErrorPanel</Eyebrow>
        <div className="mt-6 grid grid-cols-2 gap-4 max-w-2xl">
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
      </section>

      <section>
        <Eyebrow>06 DotPulse</Eyebrow>
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <DotPulse />
              <span className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">brand md</span>
            </div>
            <div className="flex items-center gap-2">
              <DotPulse size="sm" />
              <span className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">brand sm</span>
            </div>
            <div className="flex items-center gap-2">
              <DotPulse tone="neutral" />
              <span className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">neutral md</span>
            </div>
            <div className="flex items-center gap-2">
              <DotPulse tone="neutral" size="sm" />
              <span className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">neutral sm</span>
            </div>
            <div className="flex items-center gap-2">
              <DotPulse tone="success" />
              <span className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">success md</span>
            </div>
            <div className="flex items-center gap-2">
              <DotPulse tone="success" size="sm" />
              <span className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">success sm</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DotPulse tone="brand" label="Streaming" />
            <span className="text-[var(--color-muted)] text-xs font-[family-name:var(--font-mono)]">label=&quot;Streaming&quot;</span>
          </div>
        </div>
      </section>
    </main>
  );
}
