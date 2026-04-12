"use client";
import Link from "next/link";

import type { Blueprint, Session } from "@/lib/schemas/session";

import { SessionProgressRing } from "./session-progress-ring";

type Props = {
  blueprint: Blueprint;
  session: Session | null;
  recommended: boolean;
  hrefOverride?: string;
};

const SESSION_TYPE_TO_SLUG: Record<string, string> = {
  big_picture: "big-picture",
  problem_market: "problem-market",
  business: "business",
  ask: "ask",
};

export function SessionCard({ blueprint, session, recommended, hrefOverride }: Props) {
  const slug = SESSION_TYPE_TO_SLUG[blueprint.key];
  const href =
    hrefOverride ??
    (session
      ? `/dashboard/chat/${slug}?session=${session.id}`
      : `/dashboard/chat/${slug}`);

  return (
    <Link
      href={href}
      className={`block rounded-xl p-5 border transition-colors ${
        recommended
          ? "border-emerald-500/50 bg-emerald-500/5"
          : "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{blueprint.title}</h3>
            {recommended && (
              <span className="text-xs text-emerald-400">Recommended</span>
            )}
          </div>
          <p className="text-sm text-neutral-400 mt-1">{blueprint.subtitle}</p>
        </div>
        <SessionProgressRing
          startedAt={session?.started_at ?? null}
          completedAt={session?.completed_at ?? null}
          coverageScore={session?.coverage_score ?? 0}
        />
      </div>
    </Link>
  );
}
