"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DeckUploader, type DeckState } from "./deck-uploader";

type Repo = {
  name: string | null;
  description: string | null;
  language: string | null;
  stars: number | null;
  forks: number | null;
  updated_at: string | null;
  html_url: string | null;
};

type GithubData = {
  login: string | null;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number | null;
  followers: number | null;
  following: number | null;
  created_at: string | null;
  avatar_url: string | null;
  html_url: string | null;
  top_repos: Repo[] | null;
  fetched_at: string | null;
};

type FounderMe = {
  name: string | null;
  email: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  website_url: string | null;
  what_would_make_10x: string | null;
  github_data: GithubData | string | null;
};

function parseGithubData(raw: GithubData | string | null): GithubData | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as GithubData)
        : null;
    } catch {
      return null;
    }
  }
  return raw;
}

export function ProfileAnalysis() {
  const [me, setMe] = useState<FounderMe | null>(null);
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, deckRes] = await Promise.all([
          fetch("/api/founders/me", { credentials: "include" }),
          fetch("/api/deck/latest", { credentials: "include" }),
        ]);
        if (!meRes.ok) throw new Error(`GET /api/founders/me ${meRes.status}`);
        setMe((await meRes.json()) as FounderMe);
        if (deckRes.ok) {
          const body = (await deckRes.json()) as DeckState | null;
          setDeck(body);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <p className="en-surface__eyebrow" style={{ padding: "2rem 0" }}>
        Loading profile…
      </p>
    );
  }
  if (error || !me) {
    return (
      <div
        className="en-card en-card--danger"
        role="alert"
        style={{ padding: "1rem 1.25rem" }}
      >
        <p style={{ margin: 0, color: "var(--color-signal-neg)" }}>
          {error ?? "No profile"}
        </p>
      </div>
    );
  }

  const githubData = parseGithubData(me.github_data);
  const connectedCount = [
    me.linkedin_url,
    me.github_username,
    me.website_url,
  ].filter(Boolean).length;

  return (
    <>
      <header className="en-surface__head en-surface__head--row">
        <div>
          <p className="en-surface__eyebrow">Profile</p>
          <h1 className="en-surface__title">
            What your mentor <em>knows about you</em>.
          </h1>
          <p className="en-surface__subtitle">
            The more signals you connect, the sharper the coaching. Everything
            here stays on your server.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="en-button"
          data-variant="ghost"
        >
          Edit in settings
        </Link>
      </header>

      <div className="en-sources-grid">
        <SourceCard
          title="Identity"
          connected={Boolean(me.name)}
          body={
            <div>
              <div
                style={{
                  color: "var(--color-text)",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                }}
              >
                {me.name}
              </div>
              <div
                style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}
              >
                {me.email}
              </div>
            </div>
          }
        />
        <SourceCard
          title="LinkedIn"
          connected={Boolean(me.linkedin_url)}
          body={
            me.linkedin_url ? (
              <a
                href={me.linkedin_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--color-accent)",
                  textDecoration: "underline",
                  wordBreak: "break-all",
                  fontSize: "0.8125rem",
                }}
              >
                {me.linkedin_url}
              </a>
            ) : (
              <span
                style={{
                  color: "var(--color-text-dim)",
                  fontSize: "0.8125rem",
                }}
              >
                Not connected
              </span>
            )
          }
        />
        <SourceCard
          title="Website"
          connected={Boolean(me.website_url)}
          body={
            me.website_url ? (
              <a
                href={me.website_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--color-accent)",
                  textDecoration: "underline",
                  wordBreak: "break-all",
                  fontSize: "0.8125rem",
                }}
              >
                {me.website_url}
              </a>
            ) : (
              <span
                style={{
                  color: "var(--color-text-dim)",
                  fontSize: "0.8125rem",
                }}
              >
                Not connected
              </span>
            )
          }
        />
      </div>

      <GithubPanel username={me.github_username} data={githubData} />

      <DeckUploader initial={deck} onUploaded={setDeck} />

      <section className="en-card">
        <div>
          <h2 className="en-card__title">Signals your mentor uses</h2>
          <p className="en-card__subtitle">
            {connectedCount} of 3 public links connected.
          </p>
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.625rem",
          }}
        >
          <SignalRow on={Boolean(me.linkedin_url)} label="LinkedIn URL" value={me.linkedin_url ? "present" : "missing"} />
          <SignalRow
            on={Boolean(githubData)}
            label="GitHub bio + top repos"
            value={
              githubData
                ? "enriched"
                : me.github_username
                  ? "fetching…"
                  : "not connected"
            }
          />
          <SignalRow on={Boolean(me.website_url)} label="Website URL" value={me.website_url ? "present" : "missing"} />
          <SignalRow
            on={Boolean(me.what_would_make_10x)}
            label="10× outcome goal"
            value={me.what_would_make_10x ? "captured" : "missing"}
          />
        </ul>
      </section>
    </>
  );
}

function SourceCard({
  title,
  connected,
  body,
}: {
  title: string;
  connected: boolean;
  body: React.ReactNode;
}) {
  return (
    <div className="en-source">
      <div className="en-source__head">
        <span className="en-source__label">{title}</span>
        <span
          className="en-dot"
          data-on={connected || undefined}
          aria-label={connected ? "connected" : "not connected"}
        />
      </div>
      {body}
    </div>
  );
}

function SignalRow({
  on,
  label,
  value,
}: {
  on: boolean;
  label: string;
  value: string;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        fontSize: "0.875rem",
        color: "var(--color-text-muted)",
      }}
    >
      <span className="en-dot" data-on={on || undefined} aria-hidden />
      <span style={{ color: "var(--color-text)" }}>{label}</span>
      <span
        style={{
          marginLeft: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: on ? "var(--color-signal-pos)" : "var(--color-text-dim)",
        }}
      >
        {value}
      </span>
    </li>
  );
}

function GithubPanel({
  username,
  data,
}: {
  username: string | null;
  data: GithubData | null;
}) {
  if (!username) {
    return (
      <section className="en-card en-card--dashed">
        <h2 className="en-card__title">GitHub</h2>
        <p className="en-card__subtitle">
          Add a GitHub username in{" "}
          <Link
            href="/dashboard/settings"
            style={{
              color: "var(--color-accent)",
              textDecoration: "underline",
            }}
          >
            settings
          </Link>{" "}
          to enrich your mentor&rsquo;s context with your public repos.
        </p>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="en-card">
        <h2 className="en-card__title">GitHub · @{username}</h2>
        <p className="en-card__subtitle">
          Fetching your public profile… reload in a few seconds.
        </p>
      </section>
    );
  }

  const repos = data.top_repos ?? [];

  return (
    <section className="en-card">
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {data.avatar_url && (
          <img
            src={data.avatar_url}
            alt={data.login ?? "github avatar"}
            style={{
              width: "3.25rem",
              height: "3.25rem",
              borderRadius: "50%",
              border: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
            <h2 className="en-card__title">{data.name ?? data.login ?? username}</h2>
            <a
              href={data.html_url ?? `https://github.com/${username}`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "var(--color-accent)",
                fontSize: "0.8125rem",
                textDecoration: "underline",
              }}
            >
              @{data.login ?? username}
            </a>
          </div>
          {data.bio && (
            <p
              style={{
                marginTop: "0.375rem",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              {data.bio}
            </p>
          )}
          <div
            style={{
              marginTop: "0.625rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem 1.25rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-text-dim)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {data.company && <span>{data.company}</span>}
            {data.location && <span>{data.location}</span>}
            {data.public_repos != null && <span>{data.public_repos} repos</span>}
            {data.followers != null && <span>{data.followers} followers</span>}
          </div>
        </div>
      </div>

      {repos.length > 0 && (
        <div>
          <p className="en-card__eyebrow" style={{ marginBottom: "0.625rem" }}>
            Top repos
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {repos.map((r) => (
              <a
                key={r.name ?? String(Math.random())}
                href={r.html_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  padding: "0.75rem 0.875rem",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 140ms ease-out",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <span style={{ color: "var(--color-text)", fontWeight: 500, fontSize: "0.875rem" }}>
                    {r.name}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      gap: "0.875rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      color: "var(--color-text-dim)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {r.language && <span>{r.language}</span>}
                    {r.stars != null && <span>★ {r.stars}</span>}
                  </span>
                </div>
                {r.description && (
                  <p
                    style={{
                      margin: "0.375rem 0 0",
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.45,
                    }}
                  >
                    {r.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
