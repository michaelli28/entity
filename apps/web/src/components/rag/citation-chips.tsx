"use client";
import { useState } from "react";

import type { Citation } from "@/lib/schemas/citation";

interface CitationChipsProps {
  citations: Citation[];
  compact?: boolean;
}

export function CitationChips({ citations, compact = false }: CitationChipsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (citations.length === 0) return null;

  const open = citations.find((c) => c.index === openIndex) ?? null;

  return (
    <div className={compact ? "mt-1.5" : "mt-3"}>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c) => {
          const active = openIndex === c.index;
          return (
            <button
              key={c.index}
              type="button"
              onClick={() => setOpenIndex(active ? null : c.index)}
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition ${
                active
                  ? "border-sky-400/60 bg-sky-400/15 text-sky-200"
                  : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white/90"
              }`}
              aria-expanded={active}
              aria-label={`Citation ${c.index}: ${c.paper_title}`}
            >
              [{c.index}]
            </button>
          );
        })}
      </div>
      {open && (
        <div className="mt-2 rounded-md border border-white/10 bg-black/30 p-2.5 text-[12px] leading-relaxed text-white/75">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <div className="font-medium text-white/90">{open.paper_title}</div>
            {open.section && (
              <div className="shrink-0 text-[10px] uppercase tracking-wide text-white/40">
                {open.section}
              </div>
            )}
          </div>
          <p className="text-white/70">{open.snippet}</p>
        </div>
      )}
    </div>
  );
}
