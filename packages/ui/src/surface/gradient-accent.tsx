import * as React from "react";
import { cn } from "../utils";

type GradientAccentProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: React.ReactNode;
  as?: "span" | "em" | "strong";
};

export function GradientAccent({
  children,
  as: Tag = "span",
  className,
  ...rest
}: GradientAccentProps) {
  return (
    <Tag className={cn("zstar-gradient-static", className)} {...(rest as React.HTMLAttributes<HTMLElement>)}>
      {children}
    </Tag>
  );
}
