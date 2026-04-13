import * as React from "react";
import { cn } from "../utils";

interface SidebarShellProps extends React.HTMLAttributes<HTMLElement> {
  header?: React.ReactNode;
  nav: React.ReactNode;
  footer?: React.ReactNode;
  collapsed?: boolean;
  mainId?: string;
}

export function SidebarShell({
  header,
  nav,
  footer,
  collapsed = false,
  mainId = "main",
  className,
  ...rest
}: SidebarShellProps) {
  return (
    <nav
      aria-label="Sidebar"
      className={cn(
        "flex h-full flex-col border-r border-[color:var(--color-border)]",
        collapsed ? "w-16" : "w-64",
        "bg-[color:var(--color-bg)]",
        className,
      )}
      {...rest}
    >
      <a
        href={`#${mainId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[color:var(--color-bg-elevated)] focus:px-3 focus:py-2 focus:text-[color:var(--color-text)] focus-visible:outline-2 focus-visible:outline-[color:var(--color-brand-purple-light)]"
      >
        Skip to content
      </a>

      {header !== undefined && (
        <div
          data-testid="sidebar-header"
          className="flex-none p-4 border-b border-[color:var(--color-border)]"
        >
          {header}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">{nav}</div>

      {footer !== undefined && (
        <div
          data-testid="sidebar-footer"
          className="flex-none p-4 border-t border-[color:var(--color-border)]"
        >
          {footer}
        </div>
      )}
    </nav>
  );
}
