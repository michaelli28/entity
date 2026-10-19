import { Sidebar } from "@/components/sidebar";

import "../../../(dashboard)/dashboard-shell.css";

export default function ShellPreviewPage() {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <main className="flex-1 p-10 text-[var(--color-text)]">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-[var(--color-text-dim)]">
          Preview — not public
        </p>
        <h1 className="mt-3 text-[1.75rem] font-medium text-[var(--color-text)]">
          Dashboard shell
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
          Sidebar, nav-item, and wordmark: quiet dark, hairline borders, one
          vivid accent.
        </p>
      </main>
    </div>
  );
}
