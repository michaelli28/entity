"use client";
import { motion } from "motion/react";

import { CitationChips } from "@/components/rag/citation-chips";
import type { Citation } from "@/lib/schemas/citation";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export function MessageBubble({ role, content, citations }: MessageBubbleProps) {
  const isUser = role === "user";
  const showCitations =
    !isUser && Array.isArray(citations) && citations.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-[var(--color-bg)] border border-white/10"
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {showCitations && citations && (
          <CitationChips citations={citations} compact />
        )}
      </div>
    </motion.div>
  );
}
