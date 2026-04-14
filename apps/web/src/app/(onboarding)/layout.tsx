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
      <div className="zs-onboard-root">
        <div className="zs-onboard-shell">
          <header className="zs-onboard-topbar">
            <Link
              href="/"
              className="zs-onboard-wordmark"
              aria-label="ZStar — home"
            >
              ZStar
            </Link>
            <span className="zs-onboard-meta">Founder setup</span>
          </header>
          <div className="zs-onboard-main">{children}</div>
        </div>
      </div>
    </TheatricsProvider>
  );
}
