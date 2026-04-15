"use client";
import { UserButton } from "@clerk/nextjs";
import {
  CaretLeft,
  CaretRight,
  ChartPieSlice,
  GearSix,
  IdentificationCard,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { SeedDemoButton } from "@/components/dev/seed-demo-button";
import { useBlueprints, useSessions } from "@/lib/hooks/use-sessions";

import { NavItem } from "./nav-item";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { data: blueprints = [] } = useBlueprints();
  const { data: sessions = [] } = useSessions();
  const core = blueprints.filter((b) => b.order < 99);
  const doneCount = core.filter((b) =>
    sessions.find((s) => s.session_type === b.key && s.completed_at),
  ).length;

  return (
    <aside className="en-sidebar" data-collapsed={collapsed || undefined}>
      <div className="en-sidebar__head">
        <Link
          href="/dashboard"
          className="en-sidebar__mark"
          aria-label="Entity — dashboard"
          aria-hidden="true"
          tabIndex={-1}
        />
        <Link
          href="/dashboard"
          className="en-wordmark"
          aria-label="Entity — dashboard"
        >
          Entity
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="en-icon-btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
        </button>
      </div>

      <nav className="en-sidebar__nav" aria-label="Primary">
        <p className="en-eyebrow">Workspace</p>
        <NavItem
          href="/dashboard/sessions"
          icon={<Sparkle weight="duotone" size={18} />}
          label="Sessions"
          collapsed={collapsed}
          badge={core.length > 0 ? `${doneCount}/${core.length}` : undefined}
        />
        <NavItem
          href="/dashboard/scores"
          icon={<ChartPieSlice weight="duotone" size={18} />}
          label="Scores"
          collapsed={collapsed}
        />
        <NavItem
          href="/dashboard/profile"
          icon={<IdentificationCard weight="duotone" size={18} />}
          label="Profile"
          collapsed={collapsed}
        />
        <NavItem
          href="/dashboard/settings"
          icon={<GearSix weight="duotone" size={18} />}
          label="Settings"
          collapsed={collapsed}
        />
        <div className="en-sidebar__seed">
          <SeedDemoButton />
        </div>
      </nav>

      <div className="en-sidebar__foot">
        <UserButton afterSignOutUrl="/sign-in" />
        <span className="en-sidebar__foot-label">Account</span>
      </div>
    </aside>
  );
}
