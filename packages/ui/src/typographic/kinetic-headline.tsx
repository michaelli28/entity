"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "../utils";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { Display } from "./display";

type HeadingLevel = "h1" | "h2" | "h3";
type KineticTier = "full" | "medium" | "calm";

type KineticHeadlineProps = {
  children: string;
  as?: HeadingLevel;
  tier?: KineticTier;
  className?: string;
  "aria-label"?: string;
};

const sizeByLevel: Record<HeadingLevel, string> = {
  h1: "text-[clamp(52px,6.5vw,100px)] leading-[0.95] tracking-[-0.03em]",
  h2: "text-[clamp(36px,4vw,60px)] leading-none tracking-[-0.015em]",
  h3: "text-[clamp(28px,3vw,44px)] leading-tight tracking-[-0.01em]",
};

export function KineticHeadline({
  children,
  as = "h1",
  tier = "full",
  className,
  ...rest
}: KineticHeadlineProps) {
  const reduced = useReducedMotion();
  const shouldAnimate = !reduced && tier !== "calm";

  const ariaLabel = rest["aria-label"] ?? children;

  if (!shouldAnimate) {
    return (
      <Display as={as} className={className} aria-label={ariaLabel}>
        {children}
      </Display>
    );
  }

  const glyphs = Array.from(children);
  const Tag = motion[as];

  return (
    <Tag
      aria-label={ariaLabel}
      className={cn(
        "font-[family-name:var(--font-display)] text-[var(--color-text)]",
        sizeByLevel[as],
        className,
      )}
    >
      {glyphs.map((g, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block", whiteSpace: "pre" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, type: "spring", stiffness: 320, damping: 24 }}
        >
          {g}
        </motion.span>
      ))}
    </Tag>
  );
}
