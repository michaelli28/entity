"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MarketingNavProps {
  isAuthed: boolean;
}

export function MarketingNav({ isAuthed }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className="mkt-nav" data-scrolled={scrolled}>
      <div className="mkt-container mkt-nav-inner">
        <Link href="/" className="mkt-wordmark" aria-label="ZStar home">
          ZStar
        </Link>

        <div className="mkt-nav-links" aria-label="Primary">
          <a href="#how" className="mkt-nav-link">How it works</a>
          <a href="#signals" className="mkt-nav-link">Signals</a>
          <a href="#trust" className="mkt-nav-link">Trust</a>
        </div>

        <div className="mkt-nav-cta">
          {isAuthed ? (
            <Link href="/dashboard" className="mkt-btn" data-variant="primary">
              Open dashboard
              <ArrowRight />
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="mkt-btn"
                data-variant="ghost"
                style={{ padding: "0.5rem 0.875rem" }}
              >
                Sign in
              </Link>
              <Link href="/sign-up" className="mkt-btn" data-variant="primary">
                Get access
                <ArrowRight />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
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
