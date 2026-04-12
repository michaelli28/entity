"use client";
import { useState } from "react";

export function InviteCofounderSection() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cofounder/invite", { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { token: string };
      setUrl(`${window.location.origin}/invite/${data.token}`);
    } catch {
      // fail silently — user can retry
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-white/10 p-4">
      <h2 className="mb-2 font-medium">Co-founder</h2>
      <p className="mb-3 text-sm text-white/60">
        Invite a co-founder to join your workspace. They&apos;ll have access to
        the same AI mentor and signal dashboard.
      </p>
      {url ? (
        <div className="flex flex-col gap-2">
          <code className="break-all rounded bg-white/5 px-2 py-1 text-xs text-white/80">
            {url}
          </code>
          <button
            type="button"
            onClick={() => void copy()}
            className="self-start rounded border border-white/10 px-3 py-1 text-xs hover:bg-white/5"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="rounded border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Invite co-founder"}
        </button>
      )}
    </div>
  );
}
