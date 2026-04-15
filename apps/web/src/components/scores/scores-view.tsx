"use client";
import "@/app/(dashboard)/scores.css";

import { useState } from "react";

import { CountUp } from "@/components/motion/count-up";
import { MotionItem, MotionSurface } from "@/components/motion/motion-surface";
import { useLatestScores } from "@/lib/hooks/use-scores";

import { MentorSummarySection } from "./mentor-summary";
import type { CategoryKey, MentorSummaryData } from "./mentor-summary-types";
import { ScoreRadar } from "./score-radar";

const CATEGORY_LABELS: Record<string, string> = {
  founder: "Founder",
  market: "Market",
  problem: "Problem",
  competition: "Competition",
  product: "Product",
  traction: "Traction",
  pricing: "Pricing",
  team: "Team",
};

export function ScoresView() {
  const { data, isLoading, error } = useLatestScores();
  const [summary, setSummary] = useState<MentorSummaryData | null>(null);

  if (isLoading) {
    return (
      <div className="en-scores">
        <p className="en-scores__eyebrow">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="en-scores">
        <p className="en-summary__error">Failed to load scores.</p>
      </div>
    );
  }

  if (!data) return null;

  const rationales = summary?.category_rationales ?? {};

  return (
    <MotionSurface className="en-scores">
      <header className="en-scores__head">
        <MotionItem>
          <p className="en-scores__eyebrow">Signal scores</p>
        </MotionItem>
        <MotionItem>
          <h1 className="en-scores__title">
            How you <em>read</em> to investors.
          </h1>
        </MotionItem>
        <MotionItem>
          <p className="en-scores__subtitle">
            Eight categories, one overall read. Scored off every mentor session
            and any decks you&rsquo;ve shared.
          </p>
        </MotionItem>
      </header>

      {!data.present ? (
        <MotionItem>
          <div className="en-empty">
            <span className="en-empty__label">Nothing to score yet</span>
            <p className="en-empty__text">
              Finish one mentor session — or drop in a deck — and we&rsquo;ll
              generate your first read across the eight categories.
            </p>
          </div>
        </MotionItem>
      ) : (
        <MotionItem>
          <section className="en-panel">
          <div className="en-overall">
            <div className="en-overall__stat">
              <span className="en-overall__label">Overall</span>
              <div className="en-overall__value">
                {data.overall_score != null ? (
                  <CountUp value={data.overall_score} />
                ) : (
                  "—"
                )}
                <span className="en-overall__suffix">/ 100</span>
              </div>
              {data.computed_at && (
                <span className="en-overall__meta">
                  Updated {new Date(data.computed_at).toLocaleString()}
                </span>
              )}
            </div>
            <div className="en-overall__chart">
              <ScoreRadar scores={data.category_scores} />
            </div>
          </div>

          <div style={{ marginTop: "1.75rem" }}>
            <div className="en-cats">
              {Object.entries(data.category_scores).map(([k, v]) => (
                <CategoryCard
                  key={k}
                  name={CATEGORY_LABELS[k] ?? k}
                  score={v}
                  rationale={rationales[k as CategoryKey]}
                />
              ))}
            </div>
          </div>

          {!summary && (
            <p
              className="en-overall__meta"
              style={{ marginTop: "1.25rem", textTransform: "none", letterSpacing: 0 }}
            >
              <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-sans)", fontSize: "0.8125rem" }}>
                Generate a mentor summary below to see the reasoning behind each score.
              </span>
            </p>
          )}
          </section>
        </MotionItem>
      )}

      <MotionItem>
        <MentorSummarySection summary={summary} onSummary={setSummary} />
      </MotionItem>
    </MotionSurface>
  );
}

interface CategoryCardProps {
  name: string;
  score: number;
  rationale: string | undefined;
}

function CategoryCard({ name, score, rationale }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasRationale = Boolean(rationale && rationale.trim().length > 0);
  const isLong = Boolean(rationale && rationale.length > 160);
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="en-cat">
      <div className="en-cat__row">
        <span className="en-cat__name">{name}</span>
        <span className="en-cat__score">
          {score}
          <span className="en-cat__score-suffix">/ 100</span>
        </span>
      </div>
      <div className="en-cat__bar" aria-hidden="true">
        <div
          className="en-cat__bar-fill"
          style={{ "--en-progress": pct / 100 } as React.CSSProperties}
        />
      </div>
      {hasRationale && rationale && (
        <>
          <p
            className="en-cat__rationale"
            data-clamped={expanded ? undefined : true}
          >
            {rationale}
          </p>
          {isLong && (
            <button
              type="button"
              className="en-cat__more"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
