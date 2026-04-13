import * as React from "react";
import { cn } from "../utils";

export type NavPillItem = {
  href: string;
  label: string;
  active?: boolean;
};

interface NavPillProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: NavPillItem[];
  renderLink?: (item: NavPillItem, children: React.ReactNode) => React.ReactNode;
}

const linkBase = cn(
  "inline-flex items-center rounded-full px-4 py-2 text-sm transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2",
  "focus-visible:outline-[var(--color-brand-purple-light)]",
  "relative",
);

const linkActive = cn(
  "text-[var(--color-text)] bg-[color:var(--color-bg-elevated)]",
);

const linkInactive = cn(
  "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
);

function renderDefaultLink(item: NavPillItem, children: React.ReactNode) {
  return (
    <a
      key={item.href}
      href={item.href}
      className={cn(linkBase, item.active ? linkActive : linkInactive)}
      aria-current={item.active ? "page" : undefined}
    >
      {children}
      {item.active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-4 bottom-0.5 h-px bg-[image:var(--gradient-flow)]"
        />
      )}
    </a>
  );
}

export function NavPill({
  items,
  renderLink,
  className,
  ...rest
}: NavPillProps) {
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className={cn(
        "rounded-full border border-[color:var(--color-border-interactive)]",
        "bg-[rgba(0,0,0,0.45)] backdrop-blur px-2 py-1",
        "flex items-center gap-1",
        className,
      )}
      {...rest}
    >
      {items.map((item) => {
        const linkChildren = (
          <>
            {item.label}
            {item.active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-4 bottom-0.5 h-px bg-[image:var(--gradient-flow)]"
              />
            )}
          </>
        );

        if (renderLink) {
          return renderLink(item, linkChildren);
        }

        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(linkBase, item.active ? linkActive : linkInactive)}
            aria-current={item.active ? "page" : undefined}
          >
            {item.label}
            {item.active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-4 bottom-0.5 h-px bg-[image:var(--gradient-flow)]"
              />
            )}
          </a>
        );
      })}
    </nav>
  );
}
