"use client";
import { useState } from "react";

export function IntroRequestButton() {
  const [submitted, setSubmitted] = useState(false);

  const request = async () => {
    try {
      await fetch("/api/intro-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investor_type: "seed_vc" }),
      });
    } catch {
      // fall through to submitted state anyway
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="mx-4 my-2 text-xs text-white/50">
        You&apos;re on the waitlist. We&apos;ll reach out as availability opens.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void request()}
      className="text-primary mx-4 my-2 self-start rounded-lg border border-white/10 px-3 py-1.5 text-xs underline-offset-2 hover:underline"
    >
      Request an investor intro
    </button>
  );
}
