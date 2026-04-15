import Link from "next/link";

import { TheatricsProvider } from "@/lib/theatrics/tier-context";

import { AuthQuote } from "./_components/auth-quote";

import "./auth.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TheatricsProvider value="medium">
      <div className="en-auth-root">
        <aside className="en-auth-narrative">
          <header className="en-auth-narrative__head">
            <Link
              href="/"
              className="en-auth-wordmark"
              aria-label="Entity — home"
            >
              Entity
            </Link>
            <span className="en-auth-meta">Founder mentor</span>
          </header>

          <div className="en-auth-narrative__body">
            <AuthQuote />
          </div>

          <footer className="en-auth-narrative__foot">
            <span className="en-auth-meta">© Entity 2026</span>
            <span className="en-auth-meta">
              <Link href="/privacy">Privacy</Link>
              {"  ·  "}
              <Link href="/terms">Terms</Link>
            </span>
          </footer>
        </aside>

        <section className="en-auth-widget">
          <header className="en-auth-topbar">
            <Link
              href="/"
              className="en-auth-wordmark"
              aria-label="Entity — home"
              style={{ visibility: "visible" }}
            >
              Entity
            </Link>
            <span className="en-auth-meta">
              <Link href="/privacy">Privacy</Link>
              {"  ·  "}
              <Link href="/terms">Terms</Link>
            </span>
          </header>
          <div className="en-auth-widget__inner">{children}</div>
        </section>
      </div>
    </TheatricsProvider>
  );
}
