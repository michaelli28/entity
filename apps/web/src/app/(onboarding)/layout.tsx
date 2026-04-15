import Link from "next/link";

import { TheatricsProvider } from "@/lib/theatrics/tier-context";

import "./onboarding.css";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TheatricsProvider value="medium">
      <div className="en-onboard-root">
        <div className="en-onboard-shell">
          <header className="en-onboard-topbar">
            <Link
              href="/"
              className="en-onboard-wordmark"
              aria-label="Entity — home"
            >
              Entity
            </Link>
            <span className="en-onboard-meta">Founder setup</span>
          </header>
          <div className="en-onboard-main">{children}</div>
        </div>
      </div>
    </TheatricsProvider>
  );
}
