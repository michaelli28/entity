"use client";
import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: "history_change",
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

export { posthog };
