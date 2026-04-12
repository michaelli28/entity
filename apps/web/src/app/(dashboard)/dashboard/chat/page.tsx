"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { type ChatMessage, MessageList } from "@/components/chat/message-list";
import { streamChat } from "@/lib/chat-stream";
import { posthog } from "@/lib/posthog";

export default function ChatPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = async (text: string) => {
    posthog?.capture?.("first_message_sent");
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      id: crypto.randomUUID(),
    };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: "assistant", content: "", id: assistantId },
    ]);
    setStreaming(true);
    const ac = new AbortController();
    abortRef.current = ac;

    const updateAssistant = (updater: (prev: string) => string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: updater(m.content) } : m,
        ),
      );
    };

    await streamChat({
      message: text,
      sessionId,
      signal: ac.signal,
      getToken: () => getToken({ template: "backend" }),
      handlers: {
        onSession: ({ session_id }) => setSessionId(session_id),
        onToken: (t) => updateAssistant((prev) => prev + t),
        onDone: () => setStreaming(false),
        onError: (e) => {
          setStreaming(false);
          updateAssistant(() => `\u26a0\ufe0f ${e.message}`);
        },
      },
    });
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="flex h-screen flex-col">
      <MessageList messages={messages} isStreaming={streaming} />
      <ChatInput onSend={send} disabled={streaming} />
    </div>
  );
}
