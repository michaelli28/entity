import * as React from "react";
import { cn } from "../utils";

interface MonoCaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "muted" | "accent";
  children: React.ReactNode;
}

const variantClasses: Record<NonNullable<MonoCaptionProps["variant"]>, string> = {
  default: "text-[var(--color-text)]",
  muted: "text-[var(--color-muted)]",
  accent: "text-[var(--color-brand-purple-light)]",
};

export function MonoCaption({
  variant = "default",
  className,
  children,
  ...rest
}: MonoCaptionProps) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-mono)] text-[12px] tracking-[0.06em]",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
