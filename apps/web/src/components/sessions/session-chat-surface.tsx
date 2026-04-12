"use client";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { type ChatMessage, MessageList } from "@/components/chat/message-list";
import { CompletionBanner } from "@/components/sessions/completion-banner";
import { StarterQuestions } from "@/components/sessions/starter-questions";
import { streamChat } from "@/lib/chat-stream";
import {
  useBlueprints,
  useCreateSession,
  useSessions,
} from "@/lib/hooks/use-sessions";
import type { SessionType } from "@/lib/schemas/session";

const SLUG_TO_KEY: Record<string, SessionType> = {
  "big-picture": "big_picture",
  "problem-market": "problem_market",
  business: "business",
  ask: "ask",
};

interface Props {
  sessionTypeSlug: string;
  sessionIdFromQuery: string | null;
}

export function SessionChatSurface({
  sessionTypeSlug,
  sessionIdFromQuery,
}: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { getToken } = useAuth();
  const sessionType = SLUG_TO_KEY[sessionTypeSlug];

  const { data: blueprints } = useBlueprints();
  const { data: sessions } = useSessions();
  const createSession = useCreateSession();

  const blueprint = blueprints?.find((b) => b.key === sessionType);
  const [sessionId, setSessionId] = useState<string | null>(sessionIdFromQuery);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasTriedCreateRef = useRef(false);

  useEffect(() => {
    if (sessionId) return;
    if (!sessions || !sessionType) return;
    if (hasTriedCreateRef.current) return;
    hasTriedCreateRef.current = true;

    const existing = sessions.find(
      (s) => s.session_type === sessionType && !s.completed_at,
    );
    if (existing) {
      setSessionId(existing.id);
      router.replace(
        `/dashboard/chat/${sessionTypeSlug}?session=${existing.id}`,
      );
      return;
    }
    createSession.mutate(
      { session_type: sessionType },
      {
        onSuccess: (row) => {
          setSessionId(row.id);
          router.replace(
            `/dashboard/chat/${sessionTypeSlug}?session=${row.id}`,
          );
        },
      },
    );
  }, [
    sessionId,
    sessions,
    sessionType,
    sessionTypeSlug,
    router,
    createSession,
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSend = async (text: string) => {
    if (!sessionId) return;
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
        onToken: (t) => updateAssistant((prev) => prev + t),
        onDone: () => {
          setStreaming(false);
          setTimeout(
            () => qc.invalidateQueries({ queryKey: ["session", sessionId] }),
            2000,
          );
        },
        onError: (e) => {
          setStreaming(false);
          updateAssistant(() => `\u26a0\ufe0f ${e.message}`);
        },
      },
    });
  };

  if (!sessionId || !blueprint) {
    return (
      <div className="p-6 text-neutral-500">Starting session&hellip;</div>
    );
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-6">
      <div className="mb-2">
        <h1 className="text-xl font-semibold">{blueprint.title}</h1>
        <p className="text-sm text-neutral-400">{blueprint.subtitle}</p>
      </div>
      <MessageList messages={messages} isStreaming={streaming} />
      {messages.length === 0 && (
        <StarterQuestions
          questions={blueprint.starter_questions}
          onSelect={handleSend}
        />
      )}
      <CompletionBanner
        sessionId={sessionId}
        onCompleted={() => router.push("/dashboard/sessions")}
      />
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
