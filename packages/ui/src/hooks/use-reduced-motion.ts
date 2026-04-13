"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);
    const handler = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
