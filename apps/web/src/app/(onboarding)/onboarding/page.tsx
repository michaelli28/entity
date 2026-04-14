"use client";
import Link from "next/link";
import { useEffect } from "react";

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
      <p className="zs-onboard-eyebrow">Welcome</p>
      <h1 className="zs-onboard-headline">
        A peer-reviewer for the next <em>hour</em> of your day.
      </h1>
      <p className="zs-onboard-lede">
        I&rsquo;m your AI mentor. I&rsquo;ll sharpen your fundraising narrative,
        surface the gaps investors will push on, and help you leave every
        session clearer about what to do next. Two minutes to set up.
      </p>
      <Link
        href="/onboarding/profile"
        className="zs-btn"
        data-variant="primary"
      >
        Let&rsquo;s go
        <svg
          className="zs-btn__arrow"
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
      </Link>
    </WizardCard>
  );
}
