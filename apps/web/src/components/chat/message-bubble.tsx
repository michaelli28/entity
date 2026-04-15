"use client";
import { motion } from "motion/react";

import { CitationChips } from "@/components/rag/citation-chips";
import type { Citation } from "@/lib/schemas/citation";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export function MessageBubble({
  role,
  content,
  citations,
}: MessageBubbleProps) {
  const showCitations =
    role === "assistant" && Array.isArray(citations) && citations.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className="en-chat-msg"
      data-role={role}
    >
      <span className="en-chat-msg__role">
        {role === "user" ? "You" : "Mentor"}
      </span>
      <div className="en-chat-msg__body">{content}</div>
      {showCitations && citations && (
        <div className="en-chat-msg__cites">
          <CitationChips citations={citations} compact />
        </div>
      )}
    </motion.div>
  );
}
