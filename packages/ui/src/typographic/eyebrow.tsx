import * as React from "react";
import { cn } from "../utils";

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[10px] text-[11px] font-bold tracking-[0.14em]",
        className,
      )}
      {...rest}
    >
      <span
        data-eyebrow-bar
        aria-hidden="true"
        className="h-px w-6 bg-[var(--color-brand-purple)]"
      />
      <span
        className={cn(
          "uppercase font-[family-name:var(--font-mono)]",
          "bg-[image:var(--gradient-brand)] bg-clip-text text-transparent",
        )}
      >
        {children}
      </span>
    </span>
  );
}
