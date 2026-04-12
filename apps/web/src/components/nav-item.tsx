"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
};

export function NavItem({ href, icon, label, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5"
      }`}
    >
      <span className="h-5 w-5 shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
