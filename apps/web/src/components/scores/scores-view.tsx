"use client";
import { useState } from "react";

import { useLatestScores } from "@/lib/hooks/use-scores";

import { MentorSummarySection } from "./mentor-summary";
import type { CategoryKey, MentorSummaryData } from "./mentor-summary-types";
import { ScoreRadar } from "./score-radar";

export function ScoresView() {
  const { data, isLoading, error } = useLatestScores();
  const [summary, setSummary] = useState<MentorSummaryData | null>(null);

  if (isLoading) return <div className="text-white/60">Loading scores…</div>;
  if (error) return <div className="text-red-400">Failed to load scores.</div>;
  if (!data) return null;

  const rationales = summary?.category_rationales ?? {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Signal scores</h1>
        <p className="mt-1 text-sm text-white/60">
          How your story reads across the 8 categories investors look for.
        </p>
      </header>

      {!data.present ? (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-white/70">
            No score computed yet. Complete a mentor session or upload your
            deck to generate your first scoring pass.
          </p>
        </div>
      ) : (
        <section className="rounded-xl border border-white/10 bg-neutral-900/30 p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="text-sm text-white/50">Overall</div>
              <div className="text-4xl font-semibold tabular-nums">
                {data.overall_score ?? "—"}
                <span className="ml-1 text-base text-white/40">/100</span>
              </div>
            </div>
            {data.computed_at && (
              <div className="text-xs text-white/40">
                Updated {new Date(data.computed_at).toLocaleString()}
              </div>
            )}
          </div>
          <ScoreRadar scores={data.category_scores} />
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(data.category_scores).map(([k, v]) => (
              <CategoryCard
                key={k}
                name={k}
                score={v}
                rationale={rationales[k as CategoryKey]}
              />
            ))}
          </div>
          {!summary && (
            <p className="mt-4 text-xs text-white/40">
              Generate a mentor summary below to see why you were scored the
              way you were in each category.
            </p>
          )}
        </section>
      )}

      <MentorSummarySection summary={summary} onSummary={setSummary} />
    </div>
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

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-white/40">
          {name}
        </div>
        <div className="text-xl font-semibold tabular-nums">
          {score}
          <span className="ml-1 text-xs text-white/40">/100</span>
        </div>
      </div>
      {hasRationale && rationale && (
        <>
          <p
            className={`mt-2 text-xs leading-relaxed text-white/70 ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {rationale}
          </p>
          {rationale.length > 160 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-[11px] font-medium text-sky-300/80 hover:text-sky-200"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
