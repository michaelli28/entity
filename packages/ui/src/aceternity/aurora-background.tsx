"use client";

import type { ReactNode } from "react";

import { cn } from "../utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: ReactNode;
  showRadialGradient?: boolean;
}

/**
 * Aurora Background — violet-tinted drift.
 *
 * Rewritten from the original Aceternity snippet to use Entity's OKLCH token
 * system. The upstream version depended on undefined CSS vars (--blue-500,
 * --indigo-300, --white, --black, --transparent) that don't exist in our
 * palette and used `bg-zinc-50`/`dark:bg-zinc-900` which collapsed to a
 * flat light-gray surface under our tokens.
 *
 * This version:
 *  - Uses `var(--color-bg)` for the base surface (tinted near-black)
 *  - Builds the aurora from repeating-linear-gradients of token-driven
 *    violet/indigo steps (using `color-mix` so we can thin them in place)
 *  - Keeps the same prop API so existing call-sites don't break
 */
export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden",
        "bg-[var(--color-bg)] text-[var(--color-text)]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-[10px] opacity-[0.55] blur-[32px] will-change-transform",
          // Two layered repeating gradients: a violet aurora band + a dark
          // striated overlay that gives the aurora its "brushed" quality.
          // Both reference our token colours via color-mix.
          "animate-aurora",
          "[background-image:var(--entity-aurora-stripes),var(--entity-aurora-band)]",
          "[background-size:300%,_200%]",
          "[background-position:50%_50%,50%_50%]",
          showRadialGradient &&
            "[mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]",
        )}
        style={
          {
            "--entity-aurora-band":
              "repeating-linear-gradient(100deg," +
              "oklch(0.68 0.22 258) 6%," +
              "oklch(0.58 0.20 285) 14%," +
              "oklch(0.48 0.18 275) 22%," +
              "oklch(0.38 0.14 265) 30%)",
            "--entity-aurora-stripes":
              "repeating-linear-gradient(100deg," +
              "var(--color-bg) 0%," +
              "var(--color-bg) 7%," +
              "transparent 10%," +
              "transparent 12%," +
              "var(--color-bg) 16%)",
          } as React.CSSProperties
        }
      />

      {/* Subtle radial highlight anchored top-right — gives the aurora a
          sense of having a light source without feeling like a spotlight. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 85% 0%, oklch(0.42 0.20 258 / 0.35) 0%, transparent 70%)",
        }}
      />

      {children}
    </div>
  );
}
