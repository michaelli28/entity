"use client";

import type { ReactNode } from "react";

import { cn } from "../utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: ReactNode;
  showRadialGradient?: boolean;
}

/**
 * Aurora Background — layered conic + radial gradient animation.
 * Adapted from ui.aceternity.com/components/aurora-background (MIT).
 */
export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex h-[100vh] flex-col items-center justify-center bg-zinc-50 text-slate-950 transition-bg dark:bg-zinc-900",
        className,
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `pointer-events-none absolute -inset-[10px] opacity-50 blur-[10px] will-change-transform
             [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
             [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,transparent_10%,transparent_12%,var(--black)_16%)]
             [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,transparent_10%,transparent_12%,var(--white)_16%)]
             [background-image:var(--white-gradient),var(--aurora)]
             [background-size:300%,_200%]
             [background-position:50%_50%,50%_50%]
             filter dark:[background-image:var(--dark-gradient),var(--aurora)]
             after:content-[""] after:absolute after:inset-0
             after:[background-image:var(--white-gradient),var(--aurora)]
             after:dark:[background-image:var(--dark-gradient),var(--aurora)]
             after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference
             after:animate-aurora`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        />
      </div>
      {children}
    </div>
  );
}
