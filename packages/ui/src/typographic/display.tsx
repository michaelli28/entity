import * as React from "react";
import { cn } from "../utils";

type DisplayLevel = "h1" | "h2" | "h3";

interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: DisplayLevel;
  children: React.ReactNode;
}

const sizeByLevel: Record<DisplayLevel, string> = {
  h1: "text-[clamp(52px,6.5vw,100px)] leading-[0.95] tracking-[-0.03em]",
  h2: "text-[clamp(36px,4vw,60px)] leading-none tracking-[-0.015em]",
  h3: "text-[clamp(28px,3vw,44px)] leading-tight tracking-[-0.01em]",
};

export function Display({ as = "h1", className, children, ...rest }: DisplayProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        "font-[family-name:var(--font-display)] text-[var(--color-text)]",
        sizeByLevel[as],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
