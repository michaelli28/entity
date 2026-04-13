"use client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface MentorSummary {
  headline: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
}

export function MentorSummarySection() {
  const [summary, setSummary] = useState<MentorSummary | null>(null);

  const generate = useMutation<MentorSummary, Error, void>({
    mutationFn: async () => {
      const r = await fetch("/api/scores/mentor-summary");
      if (!r.ok) {
        const body = await r.text();
        throw new Error(body || `summary ${r.status}`);
      }
      return (await r.json()) as MentorSummary;
    },
    onSuccess: (data) => setSummary(data),
  });

  return (
    <section className="rounded-xl border border-white/10 bg-neutral-900/30 p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            What your mentor thinks
          </h2>
          <p className="text-xs text-white/50">
            Brutally honest read across every session. No corporate-speak.
          </p>
        </div>
        <button
          type="button"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="shrink-0 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white hover:border-white/30 disabled:opacity-60"
        >
          {generate.isPending
            ? "Thinking…"
            : summary
              ? "Regenerate"
              : "Generate summary"}
        </button>
      </div>

      {generate.error && (
        <p className="mb-3 text-sm text-red-400">
          {generate.error.message.includes("No session transcripts")
            ? "Start a mentor session first — there's nothing to summarize yet."
            : `Failed: ${generate.error.message}`}
        </p>
      )}

      {summary ? (
        <div className="space-y-5">
          <p className="text-base leading-relaxed text-white">
            {summary.headline}
          </p>

          <SummaryList
            title="Strengths"
            items={summary.strengths}
            accent="text-emerald-300"
          />
          <SummaryList
            title="Weaknesses"
            items={summary.weaknesses}
            accent="text-red-300"
          />
          <SummaryList
            title="This week"
            items={summary.tips}
            accent="text-amber-300"
          />
        </div>
      ) : !generate.isPending ? (
        <p className="text-sm text-white/50">
          Click <span className="font-medium text-white/80">Generate summary</span>{" "}
          to get a full read on where you stand across every session.
        </p>
      ) : null}
    </section>
  );
}

function SummaryList({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div>
      <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${accent}`}>
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm leading-relaxed text-white/85"
          >
            <span className={`mt-1 shrink-0 ${accent}`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
