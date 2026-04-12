"use client";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { type ChatMessage, MessageList } from "@/components/chat/message-list";
import { CompletionBanner } from "@/components/sessions/completion-banner";
import { streamChat } from "@/lib/chat-stream";
import { useSession } from "@/lib/hooks/use-sessions";

interface Props {
  sessionId: string;
}

export function DeepDiveChatSurface({ sessionId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { getToken } = useAuth();
  const { data: session, isLoading } = useSession(sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (session?.completed_at) {
      router.replace(`/dashboard/sessions?completed=${sessionId}`);
    }
  }, [session, sessionId, router]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (isLoading || !session) {
    return <div className="p-6 text-neutral-500">Loading&hellip;</div>;
  }

  const handleSend = async (text: string) => {
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

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-6">
      <div className="mb-2">
        <h1 className="text-xl font-semibold">
          Deep Dive: {session.target_category}
        </h1>
        {session.target_signal && (
          <p className="text-sm text-neutral-400">{session.target_signal}</p>
        )}
      </div>
      <MessageList messages={messages} isStreaming={streaming} />
      <CompletionBanner
        sessionId={sessionId}
        onCompleted={() => router.push("/dashboard/sessions")}
      />
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
