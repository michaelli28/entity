"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Tier } from "./types";

const TheatricsContext = createContext<Tier>("full");

export function TheatricsProvider({
  value,
  children,
}: {
  value: Tier;
  children: ReactNode;
}) {
  return (
    <TheatricsContext.Provider value={value}>
      {children}
    </TheatricsContext.Provider>
  );
}

export function useMotionTier(): Tier {
  return useContext(TheatricsContext);
}
