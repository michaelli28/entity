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
    () =>
      [...blueprints]
        .filter((b) => b.order < 99)
        .sort((a, b) => a.order - b.order),
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

  if (bpLoading || sLoading) {
    return (
      <p className="zs-surface__eyebrow" style={{ padding: "2rem 0" }}>
        Loading…
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="zs-session-grid">
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
}: {
  recommendation: {
    target_category: string;
    target_signal: string;
    is_default: boolean;
  } | null;
}) {
  if (!recommendation) return null;
  const category =
    recommendation.target_category.charAt(0).toUpperCase() +
    recommendation.target_category.slice(1);
  return (
    <div className="zs-deepdive">
      <span className="zs-deepdive__eyebrow">Suggested deep dive</span>
      <h4 className="zs-deepdive__title">
        Rebuild your <em>{category.toLowerCase()}</em> story
      </h4>
      <p className="zs-deepdive__subtitle">
        Focused probe on {recommendation.target_category}.
        {recommendation.is_default &&
          " We picked this as a starting default — you can switch after."}
      </p>
      <form
        action={`/dashboard/chat/deep-dive/start?category=${encodeURIComponent(recommendation.target_category)}&signal=${encodeURIComponent(recommendation.target_signal)}`}
        method="post"
      >
        <button
          type="submit"
          className="zs-button"
          data-variant="primary"
          style={{ marginTop: "0.25rem" }}
        >
          Start deep dive
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
