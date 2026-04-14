type Props = {
  startedAt: string | null;
  completedAt: string | null;
  coverageScore: number;
  userTurnCount?: number;
  minTurns?: number;
};

export function SessionProgressRing({
  startedAt,
  completedAt,
  coverageScore,
  userTurnCount = 0,
  minTurns = 3,
}: Props) {
  if (completedAt) return <Checkmark />;
  if (!startedAt) return <NotStarted />;
  if (coverageScore === 0 && userTurnCount < minTurns) return <Analyzing />;
  return <NumericRing value={coverageScore} />;
}

const ACCENT = "oklch(0.68 0.22 295)";
const TRACK = "oklch(0.28 0.020 290)";
const POS = "oklch(0.74 0.14 160)";

function Checkmark() {
  return (
    <div
      aria-label="Completed"
      style={{
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "50%",
        background: "color-mix(in oklab, oklch(0.74 0.14 160) 16%, transparent)",
        border: "1px solid color-mix(in oklab, oklch(0.74 0.14 160) 40%, transparent)",
        color: POS,
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      ✓
    </div>
  );
}

function NotStarted() {
  return (
    <div
      aria-label="Not started"
      style={{
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "50%",
        border: "1px dashed var(--color-border-interactive)",
        flexShrink: 0,
      }}
    />
  );
}

function Analyzing() {
  return (
    <div
      aria-label="Analyzing"
      style={{
        width: "2.5rem",
        height: "2.5rem",
        borderRadius: "50%",
        border: "1.5px solid var(--color-border-interactive)",
        borderTopColor: ACCENT,
        animation: "zs-spin 900ms linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

function NumericRing({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      aria-label={`Coverage ${pct}%`}
      style={{
        position: "relative",
        width: "2.5rem",
        height: "2.5rem",
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 36 36"
        style={{
          width: "100%",
          height: "100%",
          transform: "rotate(-90deg)",
        }}
      >
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={TRACK} strokeWidth="2" />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke={ACCENT}
          strokeWidth="2"
          strokeDasharray={`${pct} 100`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.625rem",
          fontVariantNumeric: "tabular-nums",
          color: "var(--color-text)",
        }}
      >
        {pct}
      </div>
    </div>
  );
}
