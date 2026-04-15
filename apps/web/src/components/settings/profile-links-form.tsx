"use client";
import { useEffect, useState } from "react";

type FounderMe = {
  linkedin_url: string | null;
  github_username: string | null;
  website_url: string | null;
};

export function ProfileLinksForm() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
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
        setWebsiteUrl(body.website_url ?? "");
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
          website_url: websiteUrl.trim() || null,
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
      <div className="en-card">
        <span className="en-card__eyebrow">Loading profile…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="en-card en-surface-form">
      <div>
        <h2 className="en-card__title">Public links</h2>
        <p className="en-card__subtitle">
          Share where your mentor should look. These get passed into the
          mentor&rsquo;s system prompt so it can reason about your background.
        </p>
      </div>

      <label className="en-input-field">
        <span className="en-input-field__label">LinkedIn URL</span>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/yourhandle"
          className="en-input"
          autoComplete="url"
        />
      </label>

      <label className="en-input-field">
        <span className="en-input-field__label">GitHub username</span>
        <input
          type="text"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          placeholder="yourhandle"
          className="en-input"
          autoComplete="username"
        />
        <span className="en-input-field__hint">
          We&rsquo;ll fetch your public GitHub profile and top repos to enrich
          your mentor context.
        </span>
      </label>

      <label className="en-input-field">
        <span className="en-input-field__label">Website URL</span>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourproduct.com"
          className="en-input"
          autoComplete="url"
        />
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="submit"
          disabled={saving}
          className="en-button"
          data-variant="primary"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="en-input-ok">Saved</span>}
        {error && <span className="en-input-error">{error}</span>}
      </div>
    </form>
  );
}
