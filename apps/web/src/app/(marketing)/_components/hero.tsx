"use client";

import Link from "next/link";
import { motion } from "motion/react";

interface HeroProps {
  isAuthed: boolean;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero({ isAuthed }: HeroProps) {
  return (
    <section className="mkt-hero">
      <div className="mkt-container">
        <div className="mkt-hero-layout">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="mkt-hero-marker"
            >
              <span>Phase 1 · Founder preview</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease }}
              className="mkt-hero-headline"
            >
              The mentor that tells you what to do next.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease }}
              className="mkt-hero-sub"
            >
              ZStar is a private thinking partner for founders. Talk through
              the knot in your head, surface the signal buried in it, and leave
              with the next hour's work decided. No dashboards to decorate.
              No advice-column theatre.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.36, ease }}
              className="mkt-hero-ctas"
            >
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="mkt-btn"
                  data-variant="primary"
                >
                  Continue your session
                  <ArrowRight />
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="mkt-btn"
                    data-variant="primary"
                  >
                    Request an invite
                    <ArrowRight />
                  </Link>
                  <a href="#how" className="mkt-btn" data-variant="ghost">
                    See how it works
                  </a>
                </>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.45, ease }}
          >
            <MentorPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MentorPreview() {
  return (
    <figure
      className="mkt-preview"
      aria-label="Preview of a mentor conversation"
    >
      <div className="mkt-preview-head">
        <span>
          <span className="mkt-preview-dot" />
          Session · live
        </span>
        <span>08:42</span>
      </div>

      <div className="mkt-preview-body">
        <div className="mkt-bubble" data-role="founder">
          I've got three things to ship and no idea which one moves the needle.
        </div>

        <div className="mkt-bubble" data-role="mentor">
          Rank them by who stops paying if you skip it. Distribution work
          gets the next 90 minutes.
          <div className="mkt-bubble-meta">cited · pricing_notes · 2 signals</div>
        </div>
      </div>

      <div className="mkt-preview-input" aria-hidden="true">
        <span>
          Why distribution over onboarding<span className="mkt-preview-caret" />
        </span>
        <ArrowRight />
      </div>
    </figure>
  );
}

function ArrowRight() {
  return (
    <svg
      className="mkt-btn-arrow"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
