"use client";

import * as React from "react";
import { useInView } from "motion/react";
import { cn } from "../utils";
import { useReducedMotion } from "../hooks/use-reduced-motion";

type ScrollRevealTag = "div" | "section" | "article";

type ScrollRevealProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  distance?: number;
  as?: ScrollRevealTag;
};

export function ScrollReveal({
  children,
  distance = 24,
  as: Tag = "div",
  className,
  ...rest
}: ScrollRevealProps) {
  const reduced = useReducedMotion();
  const [supportsTimeline, setSupportsTimeline] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  React.useEffect(() => {
    setSupportsTimeline(
      typeof CSS !== "undefined" && CSS.supports("animation-timeline", "view()"),
    );
  }, []);

  if (reduced) {
    return (
      <Tag className={className} {...(rest as React.HTMLAttributes<HTMLElement>)}>
        {children}
      </Tag>
    );
  }

  if (supportsTimeline) {
    return (
      <Tag
        className={cn("zstar-scroll-reveal", className)}
        {...(rest as React.HTMLAttributes<HTMLElement>)}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLElement>}
      style={{
        transform: inView ? "none" : `translateY(${distance}px)`,
        opacity: inView ? 1 : 0,
        transition: "opacity 600ms ease, transform 600ms cubic-bezier(0.22,1,0.36,1)",
      }}
      className={className}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {children}
    </Tag>
  );
}
