"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

import { initPostHog, posthog } from "@/lib/posthog";

export function Providers({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
      });
    }
  }, [isLoaded, user]);

  return <>{children}</>;
}
