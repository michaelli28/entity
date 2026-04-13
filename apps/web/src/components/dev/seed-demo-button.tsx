"use client";
import { useQueryClient } from "@tanstack/react-query";
import { Flask } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SeedDemoButton() {
  return <SeedDemoButtonInner />;
}

function SeedDemoButtonInner() {
  const qc = useQueryClient();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const seed = async () => {
    setState("loading");
    setError(null);
    try {
      const r = await fetch("/api/dev/seed-demo", { method: "POST" });
      if (!r.ok) throw new Error(`seed ${r.status}`);
      await r.json();
      await qc.invalidateQueries();
      setState("ok");
      router.refresh();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={seed}
        disabled={state === "loading"}
        className="flex w-full items-center gap-2 rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-100 hover:border-amber-700/60 disabled:opacity-60"
      >
        <Flask weight="duotone" size={16} />
        <span className="flex-1 text-left">
          {state === "loading" ? "Seeding…" : "Fill test data"}
        </span>
      </button>
      {state === "ok" && (
        <p className="px-1 text-[10px] leading-tight text-emerald-400">
          Seeded — reload any page to see it.
        </p>
      )}
      {state === "error" && (
        <p className="px-1 text-[10px] leading-tight text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
