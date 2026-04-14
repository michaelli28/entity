import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";

import { MarketingNav } from "./_components/marketing-nav";
import { Hero } from "./_components/hero";
import { ScrollProgress } from "./_components/scroll-progress";
import { SignalGrid } from "./_components/signal-grid";
import { AnomalousScene } from "./_components/anomalous-scene";
import { DynamicEffects } from "./_components/dynamic-effects";

export const metadata: Metadata = {
  title: "ZStar — a private thinking partner for founders",
  description:
    "ZStar is a mentor that tells you what to do next. Private, cited, and built for the grind.",
};

export default async function HomePage() {
  const { userId } = await auth();
  const isAuthed = Boolean(userId);

  return (
    <>
      <div className="mkt-atmos" aria-hidden="true" />
      <div className="mkt-grain" aria-hidden="true" />

      <ScrollProgress />
      <DynamicEffects />
      <MarketingNav isAuthed={isAuthed} />

      <main>
        <div className="mkt-pin-track">
          <div className="mkt-pin-stage" aria-hidden="true">
            <AnomalousScene />
          </div>

          <Hero isAuthed={isAuthed} />

          <section id="problem" className="mkt-section">
          <div className="mkt-container">
            <div className="mkt-section-head">
              <span className="mkt-section-num">01</span>
              <h2 className="mkt-section-title mkt-reveal">
                The knot in a founder&rsquo;s head is not a dashboard problem.
              </h2>
            </div>

            <div className="mkt-problem">
              <blockquote className="mkt-quote mkt-reveal">
                You don&rsquo;t need another place to log the work. You need
                someone who will sit with you at 11pm and ask the one question
                that unlocks the next hour.
              </blockquote>

              <div className="mkt-problem-prose mkt-reveal">
                <p>
                  Most founder tools perform <strong>clarity</strong>. Charts.
                  Streaks. Roll-up metrics. None of it answers the real question
                  &mdash; <strong>what do I do next, and why that.</strong>
                </p>
                <p>
                  ZStar is a conversation, not a console. It listens to how you
                  describe the business, surfaces the signal you keep burying,
                  and hands back a decision you can act on before your coffee
                  goes cold.
                </p>
              </div>
            </div>
          </div>
        </section>
        </div>

        <section id="how" className="mkt-section">
          <div className="mkt-container">
            <div className="mkt-section-head">
              <span className="mkt-section-num">02</span>
              <h2 className="mkt-section-title mkt-reveal">
                Three turns from knot to next move.
              </h2>
            </div>

            <ol className="mkt-steps" aria-label="How ZStar works">
              <li className="mkt-step mkt-reveal">
                <span className="mkt-step-num">Turn 01</span>
                <h3 className="mkt-step-title">Talk it out</h3>
                <p className="mkt-step-body">
                  Voice or type &mdash; describe where you&rsquo;re stuck. The
                  mentor doesn&rsquo;t praise, summarise, or hedge. It asks the
                  question you&rsquo;ve been avoiding.
                </p>
              </li>

              <li className="mkt-step mkt-reveal">
                <span className="mkt-step-num">Turn 02</span>
                <h3 className="mkt-step-title">Surface the signal</h3>
                <p className="mkt-step-body">
                  ZStar reads the session against your profile, your prior
                  conversations, and a library of founder research. Every claim
                  it makes is cited to a source it can show you.
                </p>
              </li>

              <li className="mkt-step mkt-reveal">
                <span className="mkt-step-num">Turn 03</span>
                <h3 className="mkt-step-title">Leave with a next move</h3>
                <p className="mkt-step-body">
                  You close the tab with one decision for the next hour and a
                  written rationale you can come back to. Not a to-do list
                  &mdash; a ranked call.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="signals" className="mkt-section">
          <div className="mkt-container">
            <div className="mkt-section-head">
              <span className="mkt-section-num">03</span>
              <h2 className="mkt-section-title mkt-reveal">
                Signals, not scores to game.
              </h2>
            </div>

            <p
              className="mkt-section-lede mkt-reveal"
              style={{ marginBottom: "2.5rem" }}
            >
              Every session updates a small set of tier-based signals &mdash;
              the stuff that predicts whether you&rsquo;ll still be working on
              this in six months. Transparent. Explainable. Ignorable when you
              disagree.
            </p>

            <SignalGrid />
          </div>
        </section>

        <section id="trust" className="mkt-section">
          <div className="mkt-container">
            <div className="mkt-trust mkt-reveal">
              <div>
                <h2 className="mkt-trust-title">
                  Private by default. Yours alone, until you say otherwise.
                </h2>
                <p
                  style={{
                    marginTop: "1rem",
                    color: "var(--color-text-muted)",
                    lineHeight: "var(--leading-body)",
                    fontSize: "0.9375rem",
                    maxWidth: "46ch",
                  }}
                >
                  ZStar is built for founders who aren&rsquo;t ready to be
                  public yet. Nothing leaves your account without an explicit
                  action from you.
                </p>
              </div>

              <ul className="mkt-trust-list">
                <li>
                  Sessions encrypted at rest, scoped per founder with row-level
                  security from day one.
                </li>
                <li>
                  No training on your data. No summaries shipped to third
                  parties. Ever.
                </li>
                <li>
                  Explicit, auditable export before anything is shared with an
                  investor.
                </li>
                <li>
                  One-click purge of any session, profile, or signal &mdash;
                  including the embeddings.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="mkt-section"
          style={{ paddingBlock: "clamp(3rem, 8vh, 6rem)" }}
        >
          <div
            className="mkt-container"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "1.5rem",
            }}
          >
            <h2
              className="mkt-section-title mkt-reveal"
              style={{ maxWidth: "24ch" }}
            >
              Ready for the next hour&rsquo;s work to decide itself?
            </h2>
            <div className="mkt-hero-ctas">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="mkt-btn"
                  data-variant="primary"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="mkt-btn"
                    data-variant="primary"
                  >
                    Request an invite
                  </Link>
                  <Link
                    href="/sign-in"
                    className="mkt-btn"
                    data-variant="ghost"
                  >
                    I already have one
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="mkt-container mkt-footer">
        <span>
          &copy; {new Date().getFullYear()} ZStar. Built for the grind.
        </span>
        <nav className="mkt-footer-links" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/subprocessors">Subprocessors</Link>
        </nav>
      </footer>
    </>
  );
}
