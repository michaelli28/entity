"use client";
import { useEffect, useState } from "react";

type FounderMe = {
  linkedin_url: string | null;
  github_username: string | null;
};

export function ProfileLinksForm() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/founders/me", { credentials: "include" });
        if (!r.ok) throw new Error(`GET /api/founders/me ${r.status}`);
        const body = (await r.json()) as FounderMe;
        setLinkedinUrl(body.linkedin_url ?? "");
        setGithubUsername(body.github_username ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await fetch("/api/founders/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          linkedin_url: linkedinUrl.trim() || null,
          github_username: githubUsername.trim().replace(/^@/, "") || null,
        }),
      });
      if (!r.ok) throw new Error(`PATCH ${r.status}`);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 p-4 text-sm text-white/60">
        Loading profile…
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-lg border border-white/10 p-4"
    >
      <div>
        <h2 className="mb-1 font-medium">Public links</h2>
        <p className="text-sm text-white/60">
          Share where your mentor should look. These get passed into the mentor&apos;s
          system prompt so it can reason about your background.
        </p>
      </div>

      <label className="block">
        <span className="text-sm text-white/70">LinkedIn URL</span>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/yourhandle"
          className="mt-1 block w-full rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/60 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm text-white/70">GitHub username</span>
        <input
          type="text"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          placeholder="yourhandle"
          className="mt-1 block w-full rounded-md border border-white/15 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/60 focus:outline-none"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
