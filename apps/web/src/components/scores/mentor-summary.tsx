"use client";
import { useMutation } from "@tanstack/react-query";

import { CitationChips } from "@/components/rag/citation-chips";
import type { Citation } from "@/lib/schemas/citation";

import type { MentorSummaryData } from "./mentor-summary-types";

interface MentorSummarySectionProps {
  summary: MentorSummaryData | null;
  onSummary: (data: MentorSummaryData) => void;
}

export function MentorSummarySection({
  summary,
  onSummary,
}: MentorSummarySectionProps) {
  const generate = useMutation<MentorSummaryData, Error, void>({
    mutationFn: async () => {
      const r = await fetch("/api/scores/mentor-summary");
      if (!r.ok) {
        const body = await r.text();
        throw new Error(body || `summary ${r.status}`);
      }
      return (await r.json()) as MentorSummaryData;
    },
    onSuccess: (data) => onSummary(data),
  });

  const citations: Citation[] = summary?.citations ?? [];

  return (
    <section className="en-panel en-summary">
      <header className="en-summary__head">
        <div className="en-summary__title-group">
          <h2 className="en-summary__title">
            What your mentor <em>thinks</em>.
          </h2>
          <p className="en-summary__subtitle">
            Brutally honest read across every session. No corporate-speak.
          </p>
        </div>
        <button
          type="button"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="en-summary__generate"
          data-variant={summary ? "regen" : undefined}
        >
          {generate.isPending
            ? "Thinking…"
            : summary
              ? "Regenerate"
              : "Generate summary"}
          {!generate.isPending && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </header>

      {generate.error && (
        <p className="en-summary__error">
          {generate.error.message.includes("No session transcripts")
            ? "Start a mentor session first — there's nothing to summarize yet."
            : `Failed: ${generate.error.message}`}
        </p>
      )}

      {summary ? (
        <>
          <p className="en-summary__headline">{summary.headline}</p>
          <SummaryList title="Strengths" items={summary.strengths} tone="pos" />
          <SummaryList title="Weaknesses" items={summary.weaknesses} tone="neg" />
          <SummaryList title="This week" items={summary.tips} tone="warn" />
          {citations.length > 0 && (
            <div className="en-sources">
              <h3 className="en-sources__label">Sources</h3>
              <CitationChips citations={citations} />
            </div>
          )}
        </>
      ) : !generate.isPending ? (
        <p className="en-summary__empty">
          Click <strong style={{ color: "var(--color-text)", fontWeight: 500 }}>Generate summary</strong>{" "}
          to get a full read on where you stand across every session.
        </p>
      ) : null}
    </section>
  );
}

function SummaryList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "pos" | "neg" | "warn";
}) {
  return (
    <div className="en-list" data-tone={tone}>
      <h3 className="en-list__heading">{title}</h3>
      <ul className="en-list__items">
        {items.map((item, i) => (
          <li key={i} className="en-list__item">
            <span className="en-list__marker" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
