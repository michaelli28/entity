"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { ColdReadCard } from "@/components/chat/cold-read-card";
import { type ChatMessage, MessageList } from "@/components/chat/message-list";
import { CommitmentCard } from "@/components/commitment-card";
import { streamChat } from "@/lib/chat-stream";
import { posthog } from "@/lib/posthog";

type ColdRead = {
  id: string;
  what_i_heard: string;
  investor_pushback: string[];
  three_unanswered_questions: string[];
};

type Commitment = {
  id: string;
  description: string;
};

export default function ChatPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [coldRead, setColdRead] = useState<ColdRead | null>(null);
  const [commitment, setCommitment] = useState<Commitment | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/cold-reads/latest");
        if (!res.ok) return;
        const data = (await res.json()) as Partial<ColdRead>;
        if (!cancelled && data.id) setColdRead(data as ColdRead);
      } catch {
        // Cold Read unavailable — fail silently
      }
    })();
    void (async () => {
      try {
        const res = await fetch("/api/commitments");
        if (!res.ok) return;
        const data = (await res.json()) as Commitment[];
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setCommitment(data[0]);
        }
      } catch {
        // Commitments unavailable — fail silently
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeCommitment = async (id: string) => {
    try {
      await fetch(`/api/commitments/${id}/complete`, { method: "POST" });
      setCommitment(null);
    } catch {
      // Ignore — UI already shows done state optimistically
    }
  };

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
      {coldRead && <ColdReadCard coldRead={coldRead} />}
      {commitment && (
        <CommitmentCard
          commitment={commitment}
          onDone={completeCommitment}
        />
      )}
      <MessageList messages={messages} isStreaming={streaming} />
      <ChatInput onSend={send} disabled={streaming} />
    </div>
  );
}
