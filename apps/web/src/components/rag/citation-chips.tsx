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
              className="en-citation-chip"
              data-active={active || undefined}
              aria-expanded={active}
              aria-label={`Citation ${c.index}: ${c.paper_title}`}
            >
              [{c.index}]
            </button>
          );
        })}
      </div>
      {open && (
        <div className="en-citation-card">
          <div className="en-citation-card__head">
            <div className="en-citation-card__title">{open.paper_title}</div>
            {open.section && (
              <div className="en-citation-card__section">{open.section}</div>
            )}
          </div>
          <p className="en-citation-card__snippet">{open.snippet}</p>
        </div>
      )}
    </div>
  );
}
