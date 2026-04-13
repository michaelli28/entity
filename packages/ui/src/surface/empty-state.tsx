import * as React from "react";
import { cn } from "../utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-start gap-4 py-12 px-6 max-w-md", className)}
      {...rest}
    >
      {eyebrow !== undefined && (
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] font-[family-name:var(--font-mono)]">
          {eyebrow}
        </p>
      )}

      <h2 className="font-[family-name:var(--font-display)] text-3xl leading-[1.1] text-[color:var(--color-text)] italic">
        {title}
      </h2>

      {body !== undefined && (
        <div className="text-sm text-[color:var(--color-text-muted)] leading-relaxed">
          {body}
        </div>
      )}

      {action !== undefined && <div className="mt-2">{action}</div>}
    </div>
  );
}
