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

  if (
    !session ||
    !session.suggest_complete ||
    session.completed_at ||
    dismissed
  )
    return null;

  const handleDismiss = () => {
    localStorage.setItem(`banner-dismissed:${sessionId}`, "1");
    setDismissed(true);
  };

  return (
    <div role="status" className="en-complete">
      <p className="en-complete__title">Ready to wrap?</p>
      <p className="en-complete__text">
        I think we&rsquo;ve covered what we need. You can mark this session
        complete and move on, or keep probing.
      </p>
      <div className="en-complete__actions">
        <button
          type="button"
          className="en-btn-sm"
          data-variant="primary"
          onClick={() =>
            complete.mutate(sessionId, { onSuccess: onCompleted })
          }
          disabled={complete.isPending}
        >
          {complete.isPending ? "Marking…" : "Mark complete"}
        </button>
        <button
          type="button"
          className="en-btn-sm"
          data-variant="ghost"
          onClick={handleDismiss}
        >
          Keep going
        </button>
      </div>
    </div>
  );
}
