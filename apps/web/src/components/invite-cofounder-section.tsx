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
    <section className="zs-card">
      <div>
        <h2 className="zs-card__title">Co-founder</h2>
        <p className="zs-card__subtitle">
          Invite a co-founder to join your workspace. They&rsquo;ll have
          access to the same mentor and signal dashboard.
        </p>
      </div>
      {url ? (
        <>
          <div className="zs-url-block">
            <code>{url}</code>
          </div>
          <button
            type="button"
            onClick={() => void copy()}
            className="zs-button"
            data-variant="ghost"
            style={{ alignSelf: "flex-start" }}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="zs-button"
          data-variant="ghost"
          style={{ alignSelf: "flex-start" }}
        >
          {loading ? "Generating…" : "Invite co-founder"}
        </button>
      )}
    </section>
  );
}
