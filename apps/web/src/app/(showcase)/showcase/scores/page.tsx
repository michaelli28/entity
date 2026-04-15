"use client";
import "../../../(dashboard)/scores.css";

import { useState } from "react";

import { ScoreRadar } from "@/components/scores/score-radar";

const DEMO_SCORES = {
  founder: 78,
  market: 64,
  problem: 82,
  competition: 48,
  product: 71,
  traction: 36,
  pricing: 55,
  team: 69,
} as const;

const DEMO_RATIONALES: Record<string, string> = {
  founder:
    "Strong sales instinct shows up in every session. Repeatable founder-market-fit signals: 7 years selling to the same ICP, two prior exits in adjacent verticals. The narrative is tight.",
  market:
    "TAM framing is defensible but conservative. Market timing story leans on macro trends without a crisp now-or-never wedge — consider tightening around 1-2 inflection points that make 2026 specifically the moment.",
  problem:
    "Pain points are sharp and specific. You cited three unprompted customer quotes last session that all converge on the same frequency-per-week. That&rsquo;s investor-grade evidence.",
  competition:
    "Competitive landscape felt surface-level. Named two incumbents, hand-waved on differentiation. Recommend running a full feature-by-feature matrix and identifying a moat claim you can defend.",
  product:
    "Product description is clear; wedge is clear. Missing: a crisp articulation of what you won&rsquo;t build in v1 and why.",
  traction:
    "6 design partners is promising for pre-seed — but none paying. Revenue story is weakest here; most investors will press hardest on this.",
  pricing:
    "Pricing model is reasonable but untested. You&rsquo;ve got a theory, not a data point. Two paid pilots in the next 30 days would move this category significantly.",
  team:
    "Strong founding duo. Missing a design or product-engineering hire; flag this proactively to investors as the first use of capital.",
};

const HEADLINE =
  "Your problem framing is investor-grade, but your traction story is the bottleneck. Two paid pilots would move you from 62 to 70+ overall.";

const STRENGTHS = [
  "Problem framing is concrete and backed by unprompted customer quotes.",
  "Founder-market fit reads 7/10+ — clear story of why you, why now.",
  "Coverage across mentor sessions is even; no category is entirely un-scored.",
];

const WEAKNESSES = [
  "Traction is weakest. Design partners are a leading indicator, but revenue is the lagging one investors read.",
  "Competitive moat claims are hand-wavy — name two competitors by name and explain the delta.",
  "Pricing is a theory. Two paid pilots in 30 days beats a perfect model.",
];

const TIPS = [
  "Convert one design partner to a paid pilot this week, even at 50% discount.",
  "Write a 1-pager competitive matrix covering the 3 closest incumbents.",
  "Line up a conversation with an operator-angel who ran pricing at a similar-stage company.",
];

export default function ScoresPreviewPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const order: (keyof typeof DEMO_SCORES)[] = [
    "founder",
    "market",
    "problem",
    "competition",
    "product",
    "traction",
    "pricing",
    "team",
  ];
  const label: Record<string, string> = {
    founder: "Founder",
    market: "Market",
    problem: "Problem",
    competition: "Competition",
    product: "Product",
    traction: "Traction",
    pricing: "Pricing",
    team: "Team",
  };
  return (
    <div className="en-scores">
      <header className="en-scores__head">
        <p className="en-scores__eyebrow">Signal scores</p>
        <h1 className="en-scores__title">
          How you <em>read</em> to investors.
        </h1>
        <p className="en-scores__subtitle">
          Eight categories, one overall read. Scored off every mentor session
          and any decks you&rsquo;ve shared.
        </p>
      </header>

      <section className="en-panel">
        <div className="en-overall">
          <div className="en-overall__stat">
            <span className="en-overall__label">Overall</span>
            <div className="en-overall__value">
              62
              <span className="en-overall__suffix">/ 100</span>
            </div>
            <span className="en-overall__meta">Updated 2 minutes ago</span>
          </div>
          <div className="en-overall__chart">
            <ScoreRadar scores={DEMO_SCORES} />
          </div>
        </div>

        <div style={{ marginTop: "1.75rem" }}>
          <div className="en-cats">
            {order.map((k) => {
              const rationale = DEMO_RATIONALES[k];
              const isLong = rationale.length > 160;
              const isExpanded = expanded[k] || false;
              const pct = DEMO_SCORES[k];
              return (
                <div className="en-cat" key={k}>
                  <div className="en-cat__row">
                    <span className="en-cat__name">{label[k]}</span>
                    <span className="en-cat__score">
                      {DEMO_SCORES[k]}
                      <span className="en-cat__score-suffix">/ 100</span>
                    </span>
                  </div>
                  <div className="en-cat__bar" aria-hidden>
                    <div
                      className="en-cat__bar-fill"
                      style={{ "--en-progress": pct / 100 } as React.CSSProperties}
                    />
                  </div>
                  <p
                    className="en-cat__rationale"
                    data-clamped={isExpanded ? undefined : true}
                  >
                    {rationale}
                  </p>
                  {isLong && (
                    <button
                      type="button"
                      className="en-cat__more"
                      onClick={() =>
                        setExpanded((e) => ({ ...e, [k]: !e[k] }))
                      }
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="en-panel en-summary">
        <header className="en-summary__head">
          <div className="en-summary__title-group">
            <h2 className="en-summary__title">
              What your mentor <em>thinks</em>.
            </h2>
            <p className="en-summary__subtitle">
              Brutally honest read across every session. No corporate-speak.
            </p>
          </div>
          <button type="button" className="en-summary__generate" data-variant="regen">
            Regenerate
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        <p className="en-summary__headline">{HEADLINE}</p>

        <div className="en-list" data-tone="pos">
          <h3 className="en-list__heading">Strengths</h3>
          <ul className="en-list__items">
            {STRENGTHS.map((t, i) => (
              <li className="en-list__item" key={i}>
                <span className="en-list__marker" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="en-list" data-tone="neg">
          <h3 className="en-list__heading">Weaknesses</h3>
          <ul className="en-list__items">
            {WEAKNESSES.map((t, i) => (
              <li className="en-list__item" key={i}>
                <span className="en-list__marker" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="en-list" data-tone="warn">
          <h3 className="en-list__heading">This week</h3>
          <ul className="en-list__items">
            {TIPS.map((t, i) => (
              <li className="en-list__item" key={i}>
                <span className="en-list__marker" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
