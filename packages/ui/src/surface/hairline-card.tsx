import * as React from "react";
import { cn } from "../utils";

interface HairlineCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

export function HairlineCard({
  interactive = false,
  className,
  children,
  ...rest
}: HairlineCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]",
        "p-8",
        interactive && "group transition-colors duration-200 hover:bg-[color:rgba(124,58,237,0.04)]",
        className,
      )}
      {...rest}
    >
      {children}
      {interactive && (
        <span
          data-hover-underline
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-0 bg-[image:var(--gradient-brand)] transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:w-full"
        />
      )}
    </div>
  );
}
