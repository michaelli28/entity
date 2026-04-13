"use client";

// Note: naive re-render strategy — all tokens re-animate on each `text` update.
// Phase 4 MentorChatCard must set staticMode=true once streaming is complete.

import * as React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "../hooks/use-reduced-motion";

type StreamingRevealProps = {
  text: string;
  className?: string;
  staticMode?: boolean;
};

export function StreamingReveal({ text, className, staticMode = false }: StreamingRevealProps) {
  const reduced = useReducedMotion();

  if (reduced || staticMode) {
    return <span className={className}>{text}</span>;
  }

  const tokens = text.split(/(\s+)/);

  return (
    <span className={className}>
      {tokens.map((token, i) => (
        <motion.span
          key={i}
          style={{ display: "inline" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {token}
        </motion.span>
      ))}
    </span>
  );
}
