"use client";

import * as React from "react";
import { cn } from "../utils";
import { useReducedMotion } from "../hooks/use-reduced-motion";

interface LoadingShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "full";
  label?: string;
}

const roundedMap: Record<NonNullable<LoadingShimmerProps["rounded"]>, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  full: "rounded-full",
};

export function LoadingShimmer({
  width = "100%",
  height = "1rem",
  rounded = "sm",
  label = "Loading",
  className,
  style,
  ...rest
}: LoadingShimmerProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "relative overflow-hidden bg-[color:var(--color-bg-elevated)]",
        roundedMap[rounded],
        !reducedMotion && "entity-shimmer",
        className,
      )}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}
