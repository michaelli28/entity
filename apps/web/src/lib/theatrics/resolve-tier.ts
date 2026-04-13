import type { Tier, UserStateHint } from "./types";

const MEDIUM_PREFIXES = ["/sign-in", "/sign-up", "/onboarding"] as const;

const CALM_PREFIXES = [
  "/dashboard",
  "/profile",
  "/scores",
  "/sessions",
] as const;

const FULL_PREFIXES = [
  "/terms",
  "/privacy",
  "/subprocessors",
  "/showcase",
] as const;

export function resolveTier(pathname: string, user?: UserStateHint): Tier {
  if (MEDIUM_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "medium";
  }

  if (CALM_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return user?.isFirstSession === true ? "medium" : "calm";
  }

  if (FULL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "full";
  }

  return "full";
}
