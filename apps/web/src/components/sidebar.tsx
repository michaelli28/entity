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
    <aside className="zs-sidebar" data-collapsed={collapsed || undefined}>
      <div className="zs-sidebar__head">
        <Link
          href="/dashboard"
          className="zs-sidebar__mark"
          aria-label="ZStar — dashboard"
          aria-hidden="true"
          tabIndex={-1}
        />
        <Link
          href="/dashboard"
          className="zs-wordmark"
          aria-label="ZStar — dashboard"
        >
          ZStar
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="zs-icon-btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
        </button>
      </div>

      <nav className="zs-sidebar__nav" aria-label="Primary">
        <p className="zs-eyebrow">Workspace</p>
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
        <div className="zs-sidebar__seed">
          <SeedDemoButton />
        </div>
      </nav>

      <div className="zs-sidebar__foot">
        <UserButton afterSignOutUrl="/sign-in" />
        <span className="zs-sidebar__foot-label">Account</span>
      </div>
    </aside>
  );
}
