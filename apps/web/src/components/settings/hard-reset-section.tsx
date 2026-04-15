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
    <section className="en-card en-card--danger">
      <div>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-signal-neg)",
            margin: 0,
          }}
        >
          Danger zone
        </p>
        <h2 className="en-card__title" style={{ marginTop: "0.375rem" }}>
          Hard reset
        </h2>
        <p className="en-card__subtitle">
          Wipes every mentor session, message, score, cold read, and summary
          tied to your account. Your profile stays so you can start fresh.
        </p>
      </div>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="en-button"
          data-variant="danger"
          style={{ alignSelf: "flex-start" }}
        >
          Hard reset my account
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "var(--color-text)" }}>
            This cannot be undone. Proceed?
          </span>
          <button
            type="button"
            onClick={() => reset.mutate()}
            disabled={reset.isPending}
            className="en-button"
            data-variant="danger"
          >
            {reset.isPending ? "Resetting…" : "Yes, wipe everything"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={reset.isPending}
            className="en-button"
            data-variant="ghost"
          >
            Cancel
          </button>
        </div>
      )}
      {reset.error && (
        <p className="en-input-error" style={{ marginTop: "0.5rem" }}>
          Failed: {reset.error.message}
        </p>
      )}
    </section>
  );
}
