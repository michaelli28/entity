"use client";
import "../../../(dashboard)/surfaces.css";

import Link from "next/link";

import { SessionProgressRing } from "@/components/sessions/session-progress-ring";

const NOW = new Date().toISOString();
const HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const DEMO = [
  {
    key: "big_picture",
    slug: "big-picture",
    title: "Big Picture",
    subtitle: "The highest-leverage framing of what you're building.",
    started_at: YESTERDAY,
    completed_at: YESTERDAY,
    coverage_score: 100,
    recommended: false,
  },
  {
    key: "problem_market",
    slug: "problem-market",
    title: "Problem & Market",
    subtitle: "What you're solving, who it hurts, and why now.",
    started_at: HOUR_AGO,
    completed_at: null,
    coverage_score: 62,
    recommended: true,
  },
  {
    key: "business",
    slug: "business",
    title: "Business",
    subtitle: "Pricing, unit economics, and the shape of the revenue line.",
    started_at: null,
    completed_at: null,
    coverage_score: 0,
    recommended: false,
  },
  {
    key: "ask",
    slug: "ask",
    title: "The Ask",
    subtitle: "Round size, use of funds, and what besides money you need.",
    started_at: null,
    completed_at: null,
    coverage_score: 0,
    recommended: false,
  },
];

export default function SessionsPreviewPage() {
  return (
    <div className="en-surface">
      <header className="en-surface__head">
        <p className="en-surface__eyebrow">Mentor sessions</p>
        <h1 className="en-surface__title">
          Work through your pitch, <em>one session at a time</em>.
        </h1>
        <p className="en-surface__subtitle">
          Four structured conversations cover the ground investors press on.
          Finish one, the mentor picks the next.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div className="en-session-grid">
          {DEMO.map((s) => {
            const completed = Boolean(s.completed_at);
            const statusLabel = completed
              ? "Completed"
              : s.started_at
                ? "In progress"
                : "Not started";
            return (
              <Link
                key={s.key}
                href="#"
                className="en-session-card"
                data-recommended={s.recommended || undefined}
              >
                <div className="en-session-card__head">
                  <div className="en-session-card__title-group">
                    <div className="en-session-card__eyebrow-row">
                      <span className="en-session-card__eyebrow">{statusLabel}</span>
                      {s.recommended && (
                        <span className="en-session-card__recommended">Recommended</span>
                      )}
                    </div>
                    <h3 className="en-session-card__title">{s.title}</h3>
                    <p className="en-session-card__subtitle">{s.subtitle}</p>
                  </div>
                  <SessionProgressRing
                    startedAt={s.started_at}
                    completedAt={s.completed_at}
                    coverageScore={s.coverage_score}
                  />
                </div>
                <span className="en-session-card__cta" aria-hidden>
                  {completed ? "Review" : s.started_at ? "Continue" : "Begin"} →
                </span>
              </Link>
            );
          })}
        </div>

        <div className="en-deepdive">
          <span className="en-deepdive__eyebrow">Suggested deep dive</span>
          <h4 className="en-deepdive__title">
            Rebuild your <em>traction</em> story
          </h4>
          <p className="en-deepdive__subtitle">
            Focused probe on traction. We picked this because it&rsquo;s your
            weakest category.
          </p>
          <form action="#" method="post">
            <button type="submit" className="en-button" data-variant="primary" style={{ marginTop: "0.25rem" }}>
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
      </div>

      <div>
        <Link href="#" className="en-continue">
          <span className="en-continue__left">
            <span className="en-continue__label">Continue mentor sessions</span>
            <span className="en-continue__title">Next · Business</span>
          </span>
          <span className="en-continue__count">01 / 04</span>
        </Link>
      </div>
    </div>
  );
}
