"use client";
import { motion } from "motion/react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-[var(--color-bg)] border border-white/10"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
