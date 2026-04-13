"use client";
import * as React from "react";
import { cn } from "../utils";

interface ChatComposerShellProps extends React.HTMLAttributes<HTMLFormElement> {
  left?: React.ReactNode;
  input: React.ReactNode;
  right?: React.ReactNode;
}

export function ChatComposerShell({
  left,
  input,
  right,
  className,
  ...rest
}: ChatComposerShellProps) {
  return (
    <form
      className={cn(
        // Bottom-docked, mobile-safe: dvh-aware, respects iOS safe area.
        "sticky bottom-0 z-10 w-full",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "bg-gradient-to-t from-[color:var(--color-bg)] via-[color:var(--color-bg)]/95 to-transparent",
        className,
      )}
      {...rest}
    >
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4">
        {left ? <div className="flex-none">{left}</div> : null}
        <div className="flex-1">{input}</div>
        {right ? <div className="flex-none">{right}</div> : null}
      </div>
    </form>
  );
}
