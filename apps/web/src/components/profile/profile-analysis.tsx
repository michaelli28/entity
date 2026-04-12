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
    return <div className="text-white/60">Loading your profile…</div>;
  }
  if (error || !me) {
    return <div className="text-red-400">{error ?? "No profile"}</div>;
  }

  const githubData = parseGithubData(me.github_data);
  const connectedCount = [
    me.linkedin_url,
    me.github_username,
    me.website_url,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your profile analysis</h1>
          <p className="mt-1 text-sm text-white/60">
            What your mentor knows about you. The more signals you connect, the
            sharper the coaching.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
        >
          Edit in settings
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SourceCard
          title="Identity"
          connected={Boolean(me.name)}
          body={
            <div>
              <div className="font-medium text-white">{me.name}</div>
              <div className="text-sm text-white/60">{me.email}</div>
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
                className="text-sm text-emerald-400 underline break-all"
              >
                {me.linkedin_url}
              </a>
            ) : (
              <span className="text-sm text-white/40">Not connected</span>
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
                className="text-sm text-emerald-400 underline break-all"
              >
                {me.website_url}
              </a>
            ) : (
              <span className="text-sm text-white/40">Not connected</span>
            )
          }
        />
      </section>

      <GithubPanel username={me.github_username} data={githubData} />

      <DeckUploader initial={deck} onUploaded={setDeck} />

      <section className="rounded-xl border border-white/10 p-5">
        <h2 className="font-medium">Signals your mentor uses</h2>
        <p className="mt-1 text-sm text-white/60">
          {connectedCount} of 3 public links connected.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          <li className="flex items-center gap-2">
            <SignalDot filled={Boolean(me.linkedin_url)} /> LinkedIn URL —{" "}
            {me.linkedin_url ? "present" : "missing"}
          </li>
          <li className="flex items-center gap-2">
            <SignalDot filled={Boolean(githubData)} /> GitHub bio + top
            repos — {githubData ? "enriched" : me.github_username ? "fetching…" : "not connected"}
          </li>
          <li className="flex items-center gap-2">
            <SignalDot filled={Boolean(me.website_url)} /> Website URL —{" "}
            {me.website_url ? "present" : "missing"}
          </li>
          <li className="flex items-center gap-2">
            <SignalDot filled={Boolean(me.what_would_make_10x)} /> 10x outcome
            goal — {me.what_would_make_10x ? "captured" : "missing"}
          </li>
        </ul>
      </section>
    </div>
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
    <div className="rounded-xl border border-white/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-white/50">
          {title}
        </div>
        <div
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-emerald-400" : "bg-white/20"
          }`}
        />
      </div>
      {body}
    </div>
  );
}

function SignalDot({ filled }: { filled: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        filled ? "bg-emerald-400" : "bg-white/20"
      }`}
    />
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
      <section className="rounded-xl border border-dashed border-white/10 p-5">
        <h2 className="font-medium">GitHub</h2>
        <p className="mt-1 text-sm text-white/60">
          Add a GitHub username in{" "}
          <Link className="underline" href="/dashboard/settings">
            settings
          </Link>{" "}
          to enrich your mentor&apos;s context with your public repos.
        </p>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="rounded-xl border border-white/10 p-5">
        <h2 className="font-medium">GitHub: @{username}</h2>
        <p className="mt-1 text-sm text-white/60">
          Fetching your public profile… Reload this page in a few seconds.
        </p>
      </section>
    );
  }

  const repos = data.top_repos ?? [];

  return (
    <section className="rounded-xl border border-white/10 p-5">
      <div className="flex items-start gap-4">
        {data.avatar_url && (
          <img
            src={data.avatar_url}
            alt={data.login ?? "github avatar"}
            className="h-16 w-16 rounded-full border border-white/10"
          />
        )}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h2 className="font-medium">
              {data.name ?? data.login ?? username}
            </h2>
            <a
              href={data.html_url ?? `https://github.com/${username}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-emerald-400 underline"
            >
              @{data.login ?? username}
            </a>
          </div>
          {data.bio && (
            <p className="mt-1 text-sm text-white/70">{data.bio}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/50">
            {data.company && <span>🏢 {data.company}</span>}
            {data.location && <span>📍 {data.location}</span>}
            {data.public_repos != null && (
              <span>📦 {data.public_repos} public repos</span>
            )}
            {data.followers != null && (
              <span>👥 {data.followers} followers</span>
            )}
          </div>
        </div>
      </div>

      {repos.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-medium text-white/70">Top repos</h3>
          <div className="space-y-2">
            {repos.map((r) => (
              <a
                key={r.name ?? String(Math.random())}
                href={r.html_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-white/10 bg-neutral-900/50 p-3 text-sm hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{r.name}</span>
                  <span className="flex items-center gap-3 text-xs text-white/50">
                    {r.language && <span>{r.language}</span>}
                    {r.stars != null && <span>★ {r.stars}</span>}
                  </span>
                </div>
                {r.description && (
                  <p className="mt-1 text-white/60">{r.description}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
