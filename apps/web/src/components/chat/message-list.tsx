"use client";
import { useEffect, useRef } from "react";

import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id?: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const last = messages[messages.length - 1];
  return (
    <div className="flex-1 space-y-3 overflow-auto px-4 py-6">
      {messages.map((m, i) => (
        <MessageBubble key={m.id ?? i} role={m.role} content={m.content} />
      ))}
      {isStreaming && last?.role === "user" && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
