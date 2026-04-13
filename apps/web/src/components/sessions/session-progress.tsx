"use client";
import { Check, Circle } from "@phosphor-icons/react";

import { useSessionCoverage } from "@/lib/hooks/use-sessions";

interface Props {
  sessionId: string;
}

export function SessionProgress({ sessionId }: Props) {
  const { data } = useSessionCoverage(sessionId);
  if (!data) return null;

  const coveredCount = data.target_signals.filter((s) => s.covered).length;
  const total = data.target_signals.length;
  const pct = total === 0 ? 0 : Math.round((coveredCount / total) * 100);

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>
          Progress · {coveredCount}/{total} covered
        </span>
        <span className="font-mono text-neutral-300">{pct}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/5"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
        {data.target_signals.map((sig) => (
          <li
            key={sig.key}
            className={`flex items-center gap-1.5 text-xs ${
              sig.covered ? "text-emerald-300" : "text-neutral-500"
            }`}
            title={sig.key}
          >
            {sig.covered ? (
              <Check weight="bold" size={12} />
            ) : (
              <Circle weight="regular" size={12} />
            )}
            <span>{sig.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
