"use client";
import { useLatestScores } from "@/lib/hooks/use-scores";

import { MentorSummarySection } from "./mentor-summary";
import { ScoreRadar } from "./score-radar";

export function ScoresView() {
  const { data, isLoading, error } = useLatestScores();

  if (isLoading) return <div className="text-white/60">Loading scores…</div>;
  if (error) return <div className="text-red-400">Failed to load scores.</div>;
  if (!data) return null;

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
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(data.category_scores).map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-white/10 bg-neutral-900/60 p-3"
              >
                <div className="text-xs uppercase tracking-wide text-white/40">
                  {k}
                </div>
                <div className="text-xl font-semibold tabular-nums">
                  {v}
                  <span className="ml-1 text-xs text-white/40">/100</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <MentorSummarySection />
    </div>
  );
}
