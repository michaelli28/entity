"use client";
import { useState } from "react";

export type DeckState = {
  id: string;
  filename: string;
  size_bytes: number;
  extraction_status: "pending" | "processing" | "done" | "failed";
  extraction_error?: string | null;
  extracted_sections?: Record<string, string | null> | null;
  uploaded_at: string;
  extracted_at: string | null;
};

export function DeckUploader({
  initial,
  onUploaded,
}: {
  initial: DeckState | null;
  onUploaded?: (d: DeckState) => void;
}) {
  const [deck, setDeck] = useState<DeckState | null>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollUntilDone = async (_id: string) => {
    for (const delay of [2000, 3000, 5000, 8000, 12000]) {
      await new Promise((r) => setTimeout(r, delay));
      const r = await fetch("/api/deck/latest", { credentials: "include" });
      if (!r.ok) return;
      const body = (await r.json()) as DeckState | null;
      if (!body) return;
      setDeck(body);
      if (
        body.extraction_status === "done" ||
        body.extraction_status === "failed"
      )
        return;
    }
  };

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (5 MB max).");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/deck", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!r.ok) throw new Error(`Upload ${r.status}`);
      const body = (await r.json()) as DeckState;
      setDeck(body);
      onUploaded?.(body);
      pollUntilDone(body.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 p-5">
      <h2 className="font-medium">Pitch deck</h2>
      <p className="mt-1 text-sm text-white/60">
        Upload a PDF and your mentor will read it. Extracted sections flow into
        future conversations.
      </p>

      <label className="mt-4 block cursor-pointer rounded-lg border border-dashed border-white/20 p-6 text-center hover:bg-white/5">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          disabled={uploading}
        />
        <span className="text-sm text-white/70">
          {uploading ? "Uploading…" : "Drop a PDF here or click to choose"}
        </span>
      </label>

      {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

      {deck && (
        <div className="mt-4 rounded-lg border border-white/10 bg-neutral-900/50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{deck.filename}</div>
              <div className="text-xs text-white/40">
                {(deck.size_bytes / 1024).toFixed(0)} KB
              </div>
            </div>
            <StatusBadge status={deck.extraction_status} />
          </div>
          {deck.extraction_status === "done" && deck.extracted_sections && (
            <ExtractedSections sections={deck.extracted_sections} />
          )}
          {deck.extraction_status === "failed" && deck.extraction_error && (
            <p className="mt-2 text-xs text-red-400">{deck.extraction_error}</p>
          )}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: DeckState["extraction_status"] }) {
  const palette =
    status === "done"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "failed"
        ? "bg-red-500/20 text-red-400"
        : "bg-amber-500/20 text-amber-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${palette}`}>
      {status}
    </span>
  );
}

function ExtractedSections({
  sections,
}: {
  sections: Record<string, string | null>;
}) {
  const order = [
    "one_liner",
    "problem",
    "solution",
    "market",
    "traction",
    "team",
    "ask",
    "why_now",
  ];
  const filled = order.filter((k) => sections[k]);
  if (filled.length === 0) {
    return (
      <p className="mt-2 text-xs text-white/50">
        No structured sections found. Deck is stored but may not be
        pitch-structured.
      </p>
    );
  }
  return (
    <dl className="mt-3 space-y-2 text-sm">
      {filled.map((k) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-wide text-white/40">
            {k.replace(/_/g, " ")}
          </dt>
          <dd className="text-white/80">{sections[k]}</dd>
        </div>
      ))}
    </dl>
  );
}
