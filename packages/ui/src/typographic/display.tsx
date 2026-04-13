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

function wrapEmWithGradient(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === "em") {
      const existing = (child.props as { className?: string }).className ?? "";
      return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
        className: cn(existing, "zstar-gradient-em not-italic italic"),
      });
    }
    const childProps = child.props as { children?: React.ReactNode };
    if (childProps.children != null) {
      return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {
        children: wrapEmWithGradient(childProps.children),
      });
    }
    return child;
  });
}

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
      {wrapEmWithGradient(children)}
    </Tag>
  );
}
