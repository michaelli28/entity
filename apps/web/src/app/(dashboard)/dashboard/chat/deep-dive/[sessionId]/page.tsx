import { DeepDiveChatSurface } from "@/components/sessions/deep-dive-chat-surface";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { sessionId } = await params;
  return <DeepDiveChatSurface sessionId={sessionId} />;
}
