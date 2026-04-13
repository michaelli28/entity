import * as React from "react";
import { cn } from "../utils";

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
