"use client";
import { useQuery } from "@tanstack/react-query";

import { type LatestScores, latestScoresSchema } from "@/lib/schemas/score";

export function useLatestScores() {
  return useQuery<LatestScores>({
    queryKey: ["scores", "latest"],
    staleTime: 30 * 1000,
    queryFn: async () => {
      const r = await fetch("/api/scores/latest", { credentials: "include" });
      if (!r.ok) throw new Error(`scores ${r.status}`);
      return latestScoresSchema.parse(await r.json());
    },
  });
}
