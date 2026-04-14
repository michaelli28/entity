"use client";

import { useEffect, useRef, useState } from "react";

interface Signal {
  label: string;
  value: string;
  delta: string;
  dir: "up" | "down" | "flat";
  tier: string;
}

const SIGNALS: Signal[] = [
  { label: "Commitment",     value: "A-", delta: "+1 tier",   dir: "up",   tier: "Top 20%" },
  { label: "Distribution",   value: "B",  delta: "flat",      dir: "flat", tier: "Middle band" },
  { label: "Narrative",      value: "A",  delta: "+2 tiers",  dir: "up",   tier: "Top 10%" },
  { label: "Execution risk", value: "C+", delta: "−1 tier",   dir: "down", tier: "Needs attention" },
];

export function SignalGrid() {
  const ref = useRef<HTMLDListElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reveal as soon as the cell scrolls into view — but always reveal within
    // 800ms regardless, so full-page screenshots, Lighthouse audits, and
    // print contexts always end up with the content visible.
    const fallback = window.setTimeout(() => setRevealed(true), 800);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          window.clearTimeout(fallback);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return (
    <dl
      ref={ref}
      className="mkt-signals"
      aria-label="Sample founder signals"
      data-revealed={revealed}
    >
      {SIGNALS.map((s, i) => (
        <SignalCell key={s.label} signal={s} index={i} revealed={revealed} />
      ))}
    </dl>
  );
}

interface SignalCellProps {
  signal: Signal;
  index: number;
  revealed: boolean;
}

function SignalCell({ signal, index, revealed }: SignalCellProps) {
  // Stagger reveal: each cell appears 80ms after the previous
  const delay = `${index * 80}ms`;
  return (
    <div
      className="mkt-signal"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 600ms var(--ease-out-quint) ${delay}, transform 600ms var(--ease-out-quint) ${delay}`,
      }}
    >
      <dt className="mkt-signal-label">{signal.label}</dt>
      <dd className="mkt-signal-value">
        {signal.value}
        <span className="mkt-signal-delta" data-dir={signal.dir}>
          {signal.dir === "up" && "↑ "}
          {signal.dir === "down" && "↓ "}
          {signal.dir === "flat" && "→ "}
          {signal.delta}
        </span>
      </dd>
      <span className="mkt-signal-tier">{signal.tier}</span>
    </div>
  );
}
