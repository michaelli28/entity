import {
  CaretLeft,
  ChartPieSlice,
  GearSix,
  IdentificationCard,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import "../../../(dashboard)/dashboard-shell.css";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
};

const items: Item[] = [
  {
    href: "#sessions",
    label: "Sessions",
    icon: <Sparkle weight="duotone" size={18} />,
    active: true,
    badge: "2/5",
  },
  { href: "#scores", label: "Scores", icon: <ChartPieSlice weight="duotone" size={18} /> },
  {
    href: "#profile",
    label: "Profile",
    icon: <IdentificationCard weight="duotone" size={18} />,
  },
  { href: "#settings", label: "Settings", icon: <GearSix weight="duotone" size={18} /> },
];

export default function ShellActivePreview() {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <aside className="en-sidebar">
        <div className="en-sidebar__head">
          <Link
            href="#"
            className="en-sidebar__mark"
            aria-hidden="true"
            tabIndex={-1}
          />
          <Link href="#" className="en-wordmark" aria-label="Entity — dashboard">
            Entity
          </Link>
          <button
            type="button"
            className="en-icon-btn"
            aria-label="Collapse sidebar"
          >
            <CaretLeft size={16} />
          </button>
        </div>
        <nav className="en-sidebar__nav" aria-label="Primary">
          <p className="en-eyebrow">Workspace</p>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="en-nav-item"
              data-active={it.active || undefined}
              aria-current={it.active ? "page" : undefined}
            >
              <span className="en-nav-item__marker" aria-hidden="true" />
              <span className="en-nav-item__icon">{it.icon}</span>
              <span className="en-nav-item__row">
                <span className="en-nav-item__label">{it.label}</span>
                {it.badge && <span className="en-nav-item__badge">{it.badge}</span>}
              </span>
            </Link>
          ))}
        </nav>
        <div className="en-sidebar__foot">
          <div className="h-8 w-8 rounded-full bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]" />
          <span className="en-sidebar__foot-label">Account</span>
        </div>
      </aside>
      <main className="flex-1 p-10 text-[var(--color-text)]">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-[var(--color-text-dim)]">
          Preview — active state
        </p>
        <h1 className="mt-3 text-[1.75rem] font-medium">Dashboard shell</h1>
        <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
          Sessions is the active surface. Accent rhombus + vivid text + soft tint background. No side-stripe.
        </p>
      </main>
    </div>
  );
}
