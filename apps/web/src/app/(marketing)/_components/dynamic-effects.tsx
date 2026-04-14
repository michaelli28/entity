"use client";

import { useEffect } from "react";

/*
 * Page-level dynamic effects mounted at the marketing root.
 *
 * 1. Magnetic CTAs — the primary buttons drift toward the cursor when it's
 *    near them. Subtle (max 8px), fully reversible, only on pointer:fine.
 * 2. Hero parallax — the hero text + preview drift counter to scroll, very
 *    subtly. Reversed for reduced-motion.
 * 3. Section-aware nav — the currently visible section's nav link gets a
 *    `data-active` attribute for css styling (underline persists).
 *
 * All effects are torn down on unmount and respect prefers-reduced-motion.
 */
export function DynamicEffects() {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const fineCursor = window.matchMedia("(pointer: fine)").matches;
    if (reducedMotion) return;

    // ── Magnetic CTAs ──────────────────────────────────────────────────
    const magnetic: Array<{
      el: HTMLElement;
      cleanup: () => void;
    }> = [];

    if (fineCursor) {
      const buttons = document.querySelectorAll<HTMLElement>(
        '.mkt-btn[data-variant="primary"]',
      );
      buttons.forEach((el) => {
        const onMove = (e: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const radius = 120;
          if (dist > radius) {
            el.style.transform = "";
            return;
          }
          const strength = (1 - dist / radius) * 8;
          el.style.transform = `translate(${(dx / radius) * strength}px, ${
            (dy / radius) * strength
          }px)`;
        };
        const onLeave = () => {
          el.style.transform = "";
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
        magnetic.push({
          el,
          cleanup: () => {
            window.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
            el.style.transform = "";
          },
        });
      });
    }

    // ── Hero parallax + pin-stage release fade ─────────────────────────
    const hero = document.querySelector<HTMLElement>(".mkt-hero");
    const pinStage = document.querySelector<HTMLElement>(".mkt-pin-stage");
    const pinTrack = document.querySelector<HTMLElement>(".mkt-pin-track");
    let rafScroll: number | null = null;

    // Cache layout measurements so the scroll RAF never forces a
    // synchronous reflow. offsetHeight + getBoundingClientRect() on every
    // scroll frame were the root cause of scroll-up jank near the pinned
    // icosahedron — the layout read on each frame stalls the compositor.
    let trackHeight = pinTrack?.offsetHeight ?? 0;
    let trackTopAbs =
      pinTrack ? pinTrack.getBoundingClientRect().top + window.scrollY : 0;
    let stageHeight = window.innerHeight;
    let lastOpacity = -1;

    const measure = () => {
      if (!pinTrack) return;
      trackHeight = pinTrack.offsetHeight;
      trackTopAbs = pinTrack.getBoundingClientRect().top + window.scrollY;
      stageHeight = window.innerHeight;
    };

    const onScroll = () => {
      if (rafScroll !== null) return;
      rafScroll = requestAnimationFrame(() => {
        rafScroll = null;
        const y = window.scrollY;

        // Hero parallax: drift up to -80px on the way out
        if (hero && y < 800) {
          const offset = Math.min(y * 0.18, 80);
          hero.style.setProperty("--parallax-y", `-${offset}px`);
        }

        // Pin-stage release fade: opacity 1 for the first 70% of the pin
        // track scroll progress, then linearly fades to 0 by the end.
        // Uses cached layout (trackHeight / trackTopAbs / stageHeight) to
        // avoid per-frame reflow; only style writes happen here.
        if (pinStage) {
          const pinRange = Math.max(1, trackHeight - stageHeight);
          const scrolledIntoTrack = Math.max(0, y - trackTopAbs);
          const progress = Math.min(1, scrolledIntoTrack / pinRange);
          const opacity =
            progress <= 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3);
          // Skip style writes when opacity hasn't meaningfully changed.
          if (Math.abs(opacity - lastOpacity) > 0.001) {
            lastOpacity = opacity;
            pinStage.style.setProperty("--pin-opacity", String(opacity));
          }
        }
      });
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    measure();
    onScroll();

    // ── Section-aware nav ──────────────────────────────────────────────
    const sectionIds = ["how", "signals", "trust"];
    const links = new Map<string, HTMLAnchorElement | null>();
    sectionIds.forEach((id) => {
      links.set(
        id,
        document.querySelector<HTMLAnchorElement>(`.mkt-nav-link[href="#${id}"]`),
      );
    });
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const setActive = (id: string | null) => {
      links.forEach((link, key) => {
        if (!link) return;
        if (key === id) link.dataset.active = "true";
        else delete link.dataset.active;
      });
    };

    const sectionIO = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the largest intersection ratio
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    sections.forEach((s) => sectionIO.observe(s));

    return () => {
      magnetic.forEach((m) => m.cleanup());
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafScroll !== null) cancelAnimationFrame(rafScroll);
      sectionIO.disconnect();
      setActive(null);
      if (hero) hero.style.removeProperty("--parallax-y");
      if (pinStage) pinStage.style.removeProperty("--pin-opacity");
    };
  }, []);

  return null;
}
