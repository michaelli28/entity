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

function Checkmark() {
  return (
    <div
      aria-label="Completed"
      className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"
    >
      ✓
    </div>
  );
}

function NotStarted() {
  return (
    <div
      aria-label="Not started"
      className="h-10 w-10 rounded-full border border-dashed border-neutral-700"
    />
  );
}

function Analyzing() {
  return (
    <div
      aria-label="Analyzing"
      className="h-10 w-10 rounded-full border-2 border-neutral-500 animate-pulse"
    />
  );
}

function NumericRing({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div aria-label={`Coverage ${pct}%`} className="relative h-10 w-10">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="rgb(64 64 64)"
          strokeWidth="2"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="rgb(34 197 94)"
          strokeWidth="2"
          strokeDasharray={`${pct} 100`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
        {pct}%
      </div>
    </div>
  );
}
