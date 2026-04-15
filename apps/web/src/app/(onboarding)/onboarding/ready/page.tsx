"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StepIndicator } from "@/components/onboarding/step-indicator";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { posthog } from "@/lib/posthog";

export default function ReadyStep() {
  const router = useRouter();
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    await fetch("/api/founders/me/complete-onboarding", { method: "POST" });
    posthog?.capture?.("onboarding_completed");
    router.push("/dashboard/sessions");
  };

  return (
    <WizardCard>
      <StepIndicator step={3} />
      <p className="en-onboard-eyebrow">Before we start</p>
      <h1 className="en-onboard-headline">
        The <em>ground rules</em>.
      </h1>
      <p className="en-onboard-fineprint">
        Your conversations are processed by Anthropic (Claude) under their
        commercial terms and stored encrypted. We&rsquo;ve requested Zero Data
        Retention. Don&rsquo;t paste social security numbers, credit cards, or
        other people&rsquo;s personal information. Entity provides general
        startup guidance — not investment, legal, or tax advice.
      </p>
      <p className="en-onboard-fineprint">
        <Link href="/privacy">Privacy policy</Link>
        {"  ·  "}
        <Link href="/terms">Terms</Link>
      </p>
      <label className="en-check">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <span className="en-check__label">
          I understand and agree to the terms above.
        </span>
      </label>
      <button
        type="button"
        className="en-btn"
        data-variant="primary"
        disabled={!ack || loading}
        onClick={start}
      >
        {loading ? "Starting…" : "Start my first conversation"}
        {!loading && (
          <svg
            className="en-btn__arrow"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </WizardCard>
  );
}
