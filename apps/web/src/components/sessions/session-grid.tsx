"use client";
import { useMemo } from "react";

import {
  useBlueprints,
  useDeepDiveRecommendation,
  useSessions,
} from "@/lib/hooks/use-sessions";
import type { Blueprint, Session } from "@/lib/schemas/session";

import { SessionCard } from "./session-card";

export function SessionGrid() {
  const { data: blueprints = [], isLoading: bpLoading } = useBlueprints();
  const { data: sessions = [], isLoading: sLoading } = useSessions();

  const coreBlueprints = useMemo(
    () => [...blueprints].filter((b) => b.order < 99).sort((a, b) => a.order - b.order),
    [blueprints],
  );

  const latestByType = useMemo(() => {
    const map = new Map<string, Session>();
    for (const s of sessions) {
      const existing = map.get(s.session_type);
      if (!existing || new Date(s.started_at) > new Date(existing.started_at)) {
        map.set(s.session_type, s);
      }
    }
    return map;
  }, [sessions]);

  const recommended = coreBlueprints.find(
    (b) => latestByType.get(b.key)?.completed_at == null,
  );

  const { data: recommendation } = useDeepDiveRecommendation(true);

  if (bpLoading || sLoading) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coreBlueprints.map((bp: Blueprint) => (
          <SessionCard
            key={bp.key}
            blueprint={bp}
            session={latestByType.get(bp.key) ?? null}
            recommended={recommended?.key === bp.key}
          />
        ))}
      </div>
      <DeepDiveCard recommendation={recommendation ?? null} />
    </div>
  );
}

function DeepDiveCard({
  recommendation,
}: { recommendation: { target_category: string; target_signal: string; is_default: boolean } | null }) {
  if (!recommendation) return null;
  return (
    <div className="rounded-xl p-5 border border-amber-500/40 bg-amber-500/5">
      <h4 className="text-lg font-semibold">
        Deep Dive:{" "}
        {recommendation.target_category.charAt(0).toUpperCase() +
          recommendation.target_category.slice(1)}
      </h4>
      <p className="text-sm text-neutral-400 mt-1">
        Rebuild your {recommendation.target_category} story.
        {recommendation.is_default && " (we picked this as a starting default — you can change after)"}
      </p>
      <StartDeepDiveButton recommendation={recommendation} />
    </div>
  );
}

function StartDeepDiveButton({
  recommendation,
}: { recommendation: { target_category: string; target_signal: string; is_default: boolean } }) {
  return (
    <form action={`/dashboard/chat/deep-dive/start?category=${encodeURIComponent(recommendation.target_category)}&signal=${encodeURIComponent(recommendation.target_signal)}`} method="post">
      <button className="mt-3 px-4 py-2 bg-amber-500 text-black rounded-md text-sm font-medium">Start Deep Dive</button>
    </form>
  );
}
