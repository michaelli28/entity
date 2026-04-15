"use client";

import * as React from "react";
import { cn } from "../utils";
import { useReducedMotion } from "../hooks/use-reduced-motion";

type DotSize = "sm" | "md";
type DotTone = "brand" | "neutral" | "success";

type DotPulseProps = React.HTMLAttributes<HTMLSpanElement> & {
  size?: DotSize;
  tone?: DotTone;
  label?: string;
};

const sizeClasses: Record<DotSize, string> = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
};

const toneClasses: Record<DotTone, string> = {
  brand: "bg-[var(--color-brand-purple)]",
  neutral: "bg-[var(--color-text-muted)]",
  success: "bg-emerald-400",
};

export function DotPulse({
  size = "md",
  tone = "brand",
  label = "Active",
  className,
  ...rest
}: DotPulseProps) {
  const reducedMotion = useReducedMotion();

  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center", className)} {...rest}>
      <span
        aria-hidden="true"
        className={cn(
          sizeClasses[size],
          toneClasses[tone],
          !reducedMotion && "entity-dot-pulse",
          reducedMotion && "rounded-full inline-block",
        )}
      />
    </span>
  );
}
