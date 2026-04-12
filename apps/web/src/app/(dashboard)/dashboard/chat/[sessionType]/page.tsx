import { notFound } from "next/navigation";

import { SessionChatSurface } from "@/components/sessions/session-chat-surface";

const VALID_TYPES = new Set([
  "big-picture",
  "problem-market",
  "business",
  "ask",
]);

export function generateStaticParams() {
  return [...VALID_TYPES].map((s) => ({ sessionType: s }));
}

interface PageProps {
  params: Promise<{ sessionType: string }>;
  searchParams: Promise<{ session?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { sessionType } = await params;
  const { session: sessionIdFromQuery } = await searchParams;
  if (!VALID_TYPES.has(sessionType)) notFound();
  return (
    <SessionChatSurface
      sessionTypeSlug={sessionType}
      sessionIdFromQuery={sessionIdFromQuery ?? null}
    />
  );
}
