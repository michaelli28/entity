"use client";
import Link from "next/link";
import { useEffect } from "react";

import { ShimmerButton } from "@zstar/ui";

import { StepIndicator } from "@/components/onboarding/step-indicator";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { posthog } from "@/lib/posthog";

export default function WelcomeStep() {
  useEffect(() => {
    posthog?.capture?.("onboarding_started");
  }, []);

  return (
    <WizardCard>
      <StepIndicator step={1} />
      <h1 className="mb-3 text-3xl font-semibold text-white">Welcome to ZStar</h1>
      <p className="mb-8 text-white/70">
        I&apos;m your AI mentor. I&apos;ll help you sharpen your fundraising
        narrative, identify gaps investors will push on, and build a clearer
        picture of where your startup stands. Two minutes to set up.
      </p>
      <Link href="/onboarding/profile">
        <ShimmerButton className="w-full">Let&apos;s go</ShimmerButton>
      </Link>
    </WizardCard>
  );
}
