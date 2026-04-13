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
