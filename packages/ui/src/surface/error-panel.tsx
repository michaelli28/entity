import * as React from "react";
import { cn } from "../utils";

interface ErrorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  detail?: React.ReactNode;
  retry?: () => void;
  retryLabel?: string;
}

export function ErrorPanel({
  title,
  detail,
  retry,
  retryLabel = "Try again",
  className,
  ...rest
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5 flex flex-col gap-3",
        className,
      )}
      {...rest}
    >
      <h3 className="font-[family-name:var(--font-display)] italic text-lg text-[color:var(--color-text)]">
        {title}
      </h3>

      {detail !== undefined && (
        <div className="text-sm text-[color:var(--color-text-muted)]">{detail}</div>
      )}

      {retry !== undefined && (
        <button
          type="button"
          onClick={retry}
          className="self-start rounded-full border border-[color:var(--color-border-interactive)] px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-[color:var(--color-text)] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-purple-light)]"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
