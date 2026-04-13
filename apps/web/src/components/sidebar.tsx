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
import { useState } from "react";

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
    <aside
      className={`bg-[var(--color-bg)] flex flex-col border-r border-white/10 transition-[width] ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && <span className="font-semibold">ZStar</span>}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-white/60 hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <CaretRight weight="duotone" />
          ) : (
            <CaretLeft weight="duotone" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        <NavItem
          href="/dashboard/sessions"
          icon={<Sparkle weight="duotone" size={20} />}
          label="Sessions"
          collapsed={collapsed}
          badge={core.length > 0 ? `${doneCount}/${core.length}` : undefined}
        />
        <NavItem
          href="/dashboard/scores"
          icon={<ChartPieSlice weight="duotone" size={20} />}
          label="Scores"
          collapsed={collapsed}
        />
        <NavItem
          href="/dashboard/profile"
          icon={<IdentificationCard weight="duotone" size={20} />}
          label="Profile"
          collapsed={collapsed}
        />
        <NavItem
          href="/dashboard/settings"
          icon={<GearSix weight="duotone" size={20} />}
          label="Settings"
          collapsed={collapsed}
        />
      </nav>
      <div className="border-t border-white/10 p-3">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  );
}
