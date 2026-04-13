"use client";

import * as React from "react";
import { cn } from "../utils";
import { DotPulse } from "./dot-pulse";

type ThinkingIndicatorProps = React.HTMLAttributes<HTMLSpanElement> & {
  label?: string;
};

const STAGGER_DELAYS = ["0ms", "200ms", "400ms"] as const;

export function ThinkingIndicator({
  label = "Mentor is thinking",
  className,
  ...rest
}: ThinkingIndicatorProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center gap-1", className)}
      {...rest}
    >
      {STAGGER_DELAYS.map((delay, i) => (
        <span key={i} aria-hidden="true" style={{ animationDelay: delay }}>
          <DotPulse size="sm" tone="neutral" />
        </span>
      ))}
    </span>
  );
}
