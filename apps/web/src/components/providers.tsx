"use client";
import { useUser } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { initPostHog, posthog } from "@/lib/posthog";

export function Providers({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [queryClient] = useState(() => new QueryClient());

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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
