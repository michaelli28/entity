import { TheatricsProvider } from "@/lib/theatrics/tier-context";

import "./dashboard-shell.css";
import "./surfaces.css";
import "./chat.css";
import "./scores.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TheatricsProvider value="calm">
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        {children}
      </div>
    </TheatricsProvider>
  );
}
