"use client";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { type ChatMessage, MessageList } from "@/components/chat/message-list";
import { CompletionBanner } from "@/components/sessions/completion-banner";
import { SessionProgress } from "@/components/sessions/session-progress";
import "@/app/(dashboard)/chat.css";

import { streamChat } from "@/lib/chat-stream";
import { useSession, useSessionMessages } from "@/lib/hooks/use-sessions";

const SIGNAL_LABELS: Record<string, string> = {
  founder_background: "Founder background",
  product_description: "Product description",
  icp: "Ideal customer profile",
  market_timing: "Market timing",
  pain_points: "Pain points",
  tam: "Total addressable market",
  competition_analysis: "Competitive landscape",
  moat: "Moat",
  pricing_model: "Pricing model",
  traction_metrics: "Traction metrics",
  gtm_strategy: "Go-to-market",
  team_composition: "Team composition",
  round_size: "Round size",
  terms: "Terms",
  investor_pipeline: "Investor pipeline",
  help_needed: "What you need besides money",
  mrr_or_revenue: "MRR / revenue",
  design_partners: "Design partners",
  unit_economics: "Unit economics",
};

const CATEGORY_LABELS: Record<string, string> = {
  founder: "Founder",
  market: "Market",
  problem: "Problem",
  competition: "Competition",
  product: "Product",
  traction: "Traction",
  pricing: "Pricing",
  team: "Team",
};

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

interface Props {
  sessionId: string;
}

export function DeepDiveChatSurface({ sessionId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { getToken } = useAuth();
  const { data: session, isLoading } = useSession(sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasHydratedRef = useRef(false);
  const { data: history } = useSessionMessages(sessionId);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    if (!history) return;
    hasHydratedRef.current = true;
    if (history.length > 0) {
      setMessages(
        history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      );
    }
  }, [history]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (session?.completed_at) {
      router.replace(`/dashboard/sessions?completed=${sessionId}`);
    }
  }, [session, sessionId, router]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (isLoading || !session) {
    return (
      <div className="en-chat-pending" role="status" aria-busy="true">
        <span className="en-chat-pending__label">Loading</span>
        <span className="en-chat-pending__bar" aria-hidden="true" />
      </div>
    );
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
        onCitations: (cites) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, citations: cites } : m,
            ),
          );
        },
        onDone: () => {
          setStreaming(false);
          setTimeout(() => {
            qc.invalidateQueries({ queryKey: ["session", sessionId] });
            qc.invalidateQueries({
              queryKey: ["session-coverage", sessionId],
            });
          }, 2000);
        },
        onError: (e) => {
          setStreaming(false);
          updateAssistant(() => `\u26a0\ufe0f ${e.message}`);
        },
      },
    });
  };

  return (
    <div className="en-chat">
      <div className="en-chat__inner">
        <header className="en-chat__head">
          <div className="en-chat__title-group">
            <span className="en-chat__eyebrow">Deep dive</span>
            <h1 className="en-chat__title">
              {CATEGORY_LABELS[session.target_category ?? ""] ??
                titleCase(session.target_category ?? "")}
            </h1>
            {session.target_signal && (
              <p className="en-chat__subtitle">
                Focus ·{" "}
                {SIGNAL_LABELS[session.target_signal] ??
                  titleCase(session.target_signal)}
              </p>
            )}
          </div>
        </header>
        <SessionProgress sessionId={sessionId} />
        <MessageList messages={messages} isStreaming={streaming} />
        <CompletionBanner
          sessionId={sessionId}
          onCompleted={() => router.push("/dashboard/sessions")}
        />
        <ChatInput onSend={handleSend} disabled={streaming} />
      </div>
    </div>
  );
}
