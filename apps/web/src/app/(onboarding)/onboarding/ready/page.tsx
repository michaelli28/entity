"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ShimmerButton } from "@zstar/ui";

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
      <h1 className="mb-3 text-2xl font-semibold">Before we start</h1>
      <p className="mb-4 text-sm text-white/70">
        Your conversations are processed by Anthropic (Claude) under their
        commercial terms and stored encrypted. We&apos;ve requested Zero Data
        Retention. Don&apos;t paste social security numbers, credit cards, or
        other people&apos;s personal information. ZStar provides general startup
        guidance — not investment, legal, or tax advice.
      </p>
      <p className="mb-6 text-xs text-white/50">
        <Link href="/privacy" className="underline">
          Privacy policy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>
      </p>
      <label className="mb-6 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">I understand</span>
      </label>
      <ShimmerButton
        disabled={!ack || loading}
        onClick={start}
        className="w-full"
      >
        {loading ? "Starting..." : "Start my first conversation"}
      </ShimmerButton>
    </WizardCard>
  );
}
