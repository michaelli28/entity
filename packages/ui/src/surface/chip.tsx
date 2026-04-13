import * as React from "react";
import { cn } from "../utils";

type ChipBaseProps = {
  className?: string;
  children: React.ReactNode;
};

type ChipStaticProps = ChipBaseProps &
  React.HTMLAttributes<HTMLSpanElement> & {
    onClick?: never;
  };

type ChipButtonProps = ChipBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
  };

type ChipProps = ChipStaticProps | ChipButtonProps;

const chipClasses = cn(
  "inline-flex items-center px-3 py-1.5",
  "bg-[var(--color-bg)] border border-[var(--color-border-interactive)]",
  "text-[11px] text-[var(--color-muted)] font-[family-name:var(--font-mono)]",
  "transition-colors duration-200 hover:border-[color:rgba(124,58,237,0.5)] hover:text-[var(--color-brand-purple-light)]",
);

export function Chip(props: ChipProps) {
  if ("onClick" in props && props.onClick) {
    const { className, children, onClick, ...rest } = props;
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(chipClasses, "cursor-pointer", className)}
        {...rest}
      >
        {children}
      </button>
    );
  }
  const { className, children, ...rest } = props as ChipStaticProps;
  return (
    <span
      className={cn(chipClasses, className)}
      {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
    >
      {children}
    </span>
  );
}
