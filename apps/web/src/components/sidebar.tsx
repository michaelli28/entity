"use client";
import { UserButton } from "@clerk/nextjs";
import {
  CaretLeft,
  CaretRight,
  ChatCircle,
  GearSix,
} from "@phosphor-icons/react";
import { useState } from "react";

import { NavItem } from "./nav-item";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={`bg-card flex flex-col border-r border-white/10 transition-[width] ${
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
          href="/dashboard/chat"
          icon={<ChatCircle weight="duotone" size={20} />}
          label="Chat"
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
