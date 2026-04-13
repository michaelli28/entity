"use client";
import * as React from "react";
import { useReducedMotion } from "../hooks/use-reduced-motion";

interface CustomCursorProps {
  /**
   * When false or unset, renders nothing. Phase 5 will turn this on via a
   * NEXT_PUBLIC_CURSOR env var at the consumer layout level.
   */
  enabled?: boolean;
}

export function CustomCursor({ enabled = false }: CustomCursorProps) {
  const reduced = useReducedMotion();
  const [disabled, setDisabled] = React.useState(true);
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const frameRef = React.useRef<number | null>(null);
  const targetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute gating once on mount (mostly SSR-safe — client-only rendering)
  React.useEffect(() => {
    if (!enabled) return;
    if (reduced) return;
    if (typeof window === "undefined") return;

    // Gate 1: pointer:fine
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    // Gate 2: in iframe (visibility decision left to host; if we're in an iframe, skip)
    try {
      if (window.self !== window.top) return;
    } catch {
      return; // cross-origin — assume iframe
    }

    setDisabled(false);
  }, [enabled, reduced]);

  // Pointer tracking — rAF-batched, CSS-var writes only
  React.useEffect(() => {
    if (disabled) return;
    const node = nodeRef.current;
    if (!node) return;

    const handleMove = (e: PointerEvent) => {
      // Gate 3: inputs / contenteditable / [data-no-cursor]
      const target = e.target;
      if (target instanceof HTMLElement) {
        if (
          target.closest(
            "input, textarea, [contenteditable='true'], [data-no-cursor]",
          )
        ) {
          node.style.opacity = "0";
        } else {
          node.style.opacity = "1";
        }
      }
      targetRef.current = { x: e.clientX, y: e.clientY };
      if (frameRef.current != null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const { x, y } = targetRef.current;
        node.style.setProperty("--cursor-x", `${x}px`);
        node.style.setProperty("--cursor-y", `${y}px`);
      });
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <div
      ref={nodeRef}
      aria-hidden="true"
      data-testid="zstar-cursor"
      className="zstar-cursor"
    />
  );
}
