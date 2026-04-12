"use client";
import { useEffect, useState } from "react";

import { useCompleteSession, useSession } from "@/lib/hooks/use-sessions";

type Props = {
  sessionId: string;
  onCompleted: () => void;
};

export function CompletionBanner({ sessionId, onCompleted }: Props) {
  const { data: session } = useSession(sessionId);
  const complete = useCompleteSession();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`banner-dismissed:${sessionId}`) === "1") {
      setDismissed(true);
    }
  }, [sessionId]);

  if (!session || !session.suggest_complete || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(`banner-dismissed:${sessionId}`, "1");
    setDismissed(true);
  };

  return (
    <div role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 my-4">
      <p className="text-sm mb-3">
        I think we&apos;ve covered this. Want to mark this session complete?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => complete.mutate(sessionId, { onSuccess: onCompleted })}
          disabled={complete.isPending}
          className="px-4 py-2 bg-emerald-500 text-black rounded-md text-sm font-medium">
          Mark complete
        </button>
        <button onClick={handleDismiss} className="px-4 py-2 border border-neutral-700 rounded-md text-sm">
          Keep going
        </button>
      </div>
    </div>
  );
}
