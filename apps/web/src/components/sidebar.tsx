"use client";
import { UserButton } from "@clerk/nextjs";
import {
  CaretLeft,
  CaretRight,
  ChartPieSlice,
  GearSix,
  House,
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
    <aside
      className={`bg-[var(--color-bg)] flex flex-col border-r border-white/10 transition-[width] ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="font-semibold text-white hover:text-white/80"
          >
            ZStar
          </Link>
        )}
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="rounded p-1 text-white/60 hover:bg-white/5 hover:text-white"
          >
            <House weight="duotone" size={18} />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-1 text-white/60 hover:bg-white/5 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <CaretRight weight="duotone" />
            ) : (
              <CaretLeft weight="duotone" />
            )}
          </button>
        </div>
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
        {!collapsed && (
          <div className="px-1 pt-2">
            <SeedDemoButton />
          </div>
        )}
      </nav>
      <div className="border-t border-white/10 p-3">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </aside>
  );
}
