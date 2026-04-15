"use client";
import {
  motion,
  type HTMLMotionProps,
  type Variants,
  useReducedMotion,
} from "motion/react";
import type { ReactNode } from "react";

const zsEase: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

const surfaceVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: zsEase },
  },
};

const staggerChildVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: zsEase },
  },
};

type DivProps = Omit<HTMLMotionProps<"div">, "children">;

interface WithChildren extends DivProps {
  children: ReactNode;
}

export function MotionSurface({ children, ...rest }: WithChildren) {
  const reduced = useReducedMotion();
  if (reduced) {
    const { className, style, id } = rest;
    return (
      <div
        className={className}
        style={style as React.CSSProperties | undefined}
        id={id}
      >
        {children}
      </div>
    );
  }
  return (
    <motion.div
      {...rest}
      initial="hidden"
      animate="visible"
      variants={surfaceVariants}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, ...rest }: WithChildren) {
  const reduced = useReducedMotion();
  if (reduced) {
    const { className, style, id } = rest;
    return (
      <div
        className={className}
        style={style as React.CSSProperties | undefined}
        id={id}
      >
        {children}
      </div>
    );
  }
  return (
    <motion.div {...rest} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

interface StaggerProps extends WithChildren {
  stagger?: number;
  delay?: number;
}

export function MotionStagger({
  children,
  stagger = 0.05,
  delay = 0,
  ...rest
}: StaggerProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    const { className, style, id } = rest;
    return (
      <div
        className={className}
        style={style as React.CSSProperties | undefined}
        id={id}
      >
        {children}
      </div>
    );
  }
  return (
    <motion.div
      {...rest}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({ children, ...rest }: WithChildren) {
  const reduced = useReducedMotion();
  if (reduced) {
    const { className, style, id } = rest;
    return (
      <div
        className={className}
        style={style as React.CSSProperties | undefined}
        id={id}
      >
        {children}
      </div>
    );
  }
  return (
    <motion.div {...rest} variants={staggerChildVariants}>
      {children}
    </motion.div>
  );
}
