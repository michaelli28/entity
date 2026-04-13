"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function HardResetSection() {
  const [confirming, setConfirming] = useState(false);
  const qc = useQueryClient();

  const reset = useMutation<void, Error, void>({
    mutationFn: async () => {
      const r = await fetch("/api/founders/me/reset", { method: "POST" });
      if (!r.ok) {
        const body = await r.text();
        throw new Error(body || `reset ${r.status}`);
      }
    },
    onSuccess: () => {
      qc.clear();
      setConfirming(false);
      window.location.href = "/dashboard";
    },
  });

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/[0.04] p-4">
      <h2 className="mb-1 font-medium text-red-300">Danger zone</h2>
      <p className="mb-3 text-sm text-white/60">
        Hard reset wipes every mentor session, message, score, cold read, and
        summary tied to your account. Your profile stays so you can start
        fresh.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 hover:border-red-500/70"
        >
          Hard reset my account
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/80">
            This cannot be undone. Proceed?
          </span>
          <button
            type="button"
            onClick={() => reset.mutate()}
            disabled={reset.isPending}
            className="rounded-md border border-red-500/60 bg-red-500/20 px-3 py-1.5 text-sm text-red-100 hover:border-red-400 disabled:opacity-60"
          >
            {reset.isPending ? "Resetting…" : "Yes, wipe everything"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={reset.isPending}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:border-white/30"
          >
            Cancel
          </button>
        </div>
      )}
      {reset.error && (
        <p className="mt-2 text-sm text-red-300">
          Failed: {reset.error.message}
        </p>
      )}
    </div>
  );
}
