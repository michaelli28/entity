"use client";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  delay?: number;
}

export function CountUp({ value, duration = 1.2, delay = 0.3 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useGSAP(
    () => {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setDisplay(value);
        return;
      }
      const obj = { n: 0 };
      gsap.to(obj, {
        n: value,
        duration,
        delay,
        ease: "power4.out",
        onUpdate: () => setDisplay(Math.round(obj.n)),
      });
    },
    { dependencies: [value], scope: ref },
  );

  return <span ref={ref}>{display}</span>;
}
