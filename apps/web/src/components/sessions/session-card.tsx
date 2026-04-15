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

export function SessionCard({
  blueprint,
  session,
  recommended,
  hrefOverride,
}: Props) {
  const slug = SESSION_TYPE_TO_SLUG[blueprint.key];
  const href =
    hrefOverride ??
    (session
      ? `/dashboard/chat/${slug}?session=${session.id}`
      : `/dashboard/chat/${slug}`);

  const completed = Boolean(session?.completed_at);
  const statusLabel = completed
    ? "Completed"
    : session?.started_at
      ? "In progress"
      : "Not started";

  return (
    <Link
      href={href}
      className="en-session-card"
      data-recommended={recommended || undefined}
    >
      <div className="en-session-card__head">
        <div className="en-session-card__title-group">
          <div className="en-session-card__eyebrow-row">
            <span className="en-session-card__eyebrow">{statusLabel}</span>
            {recommended && (
              <span className="en-session-card__recommended">Recommended</span>
            )}
          </div>
          <h3 className="en-session-card__title">{blueprint.title}</h3>
          <p className="en-session-card__subtitle">{blueprint.subtitle}</p>
        </div>
        <SessionProgressRing
          startedAt={session?.started_at ?? null}
          completedAt={session?.completed_at ?? null}
          coverageScore={session?.coverage_score ?? 0}
        />
      </div>
      <span className="en-session-card__cta" aria-hidden>
        {completed ? "Review" : session ? "Continue" : "Begin"} →
      </span>
    </Link>
  );
}
