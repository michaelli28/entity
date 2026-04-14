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
      <div className="zs-auth-root">
        <aside className="zs-auth-narrative">
          <header className="zs-auth-narrative__head">
            <Link
              href="/"
              className="zs-auth-wordmark"
              aria-label="ZStar — home"
            >
              ZStar
            </Link>
            <span className="zs-auth-meta">Founder mentor</span>
          </header>

          <div className="zs-auth-narrative__body">
            <AuthQuote />
          </div>

          <footer className="zs-auth-narrative__foot">
            <span className="zs-auth-meta">© ZStar 2026</span>
            <span className="zs-auth-meta">
              <Link href="/privacy">Privacy</Link>
              {"  ·  "}
              <Link href="/terms">Terms</Link>
            </span>
          </footer>
        </aside>

        <section className="zs-auth-widget">
          <header className="zs-auth-topbar">
            <Link
              href="/"
              className="zs-auth-wordmark"
              aria-label="ZStar — home"
              style={{ visibility: "visible" }}
            >
              ZStar
            </Link>
            <span className="zs-auth-meta">
              <Link href="/privacy">Privacy</Link>
              {"  ·  "}
              <Link href="/terms">Terms</Link>
            </span>
          </header>
          <div className="zs-auth-widget__inner">{children}</div>
        </section>
      </div>
    </TheatricsProvider>
  );
}
