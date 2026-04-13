"use client";

import * as React from "react";
import { cn } from "../utils";
import { AuroraBackground } from "../aceternity/aurora-background";

type HeroBackdropIntensity = "soft" | "full";

interface HeroBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  intensity?: HeroBackdropIntensity;
}

export function HeroBackdrop({
  children,
  intensity = "full",
  className,
  ...rest
}: HeroBackdropProps) {
  const isSoft = intensity === "soft";

  return (
    <div className={cn("relative isolate", className)} {...rest}>
      <AuroraBackground
        showRadialGradient={true}
        className={cn(
          "absolute inset-0 -z-10 h-full",
          isSoft && "opacity-60",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-[var(--color-bg)]",
          isSoft && "opacity-60",
        )}
      />
      {children}
    </div>
  );
}
