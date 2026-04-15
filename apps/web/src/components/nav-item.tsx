"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  badge?: string;
};

export function NavItem({ href, icon, label, collapsed, badge }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      data-active={active || undefined}
      className="en-nav-item"
    >
      <span className="en-nav-item__marker" aria-hidden="true" />
      <span className="en-nav-item__icon">{icon}</span>
      <span className="en-nav-item__row">
        <span className="en-nav-item__label">{label}</span>
        {badge && <span className="en-nav-item__badge">{badge}</span>}
      </span>
    </Link>
  );
}
