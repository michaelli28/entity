"use client";

import { useEffect, useRef } from "react";

/*
 * Thin scroll-progress bar fixed at the top of the viewport.
 * Pure CSS transform — no React state, no re-renders, no rAF inside React.
 * Width is driven by --p set on the bar element directly from the rAF loop.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p})`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="mkt-progress" aria-hidden="true">
      <div ref={barRef} className="mkt-progress-bar" />
    </div>
  );
}
