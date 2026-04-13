"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  onReset: () => void;
  onPivot: () => void;
  onDeleteAll: () => void;
  disabled?: boolean;
}

export function ChatMenu({ onReset, onPivot, onDeleteAll, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Chat options"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-neutral-800 px-2 py-1 text-sm text-neutral-300 hover:border-neutral-600 hover:text-white disabled:opacity-50"
      >
        &#8943;
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-md border border-neutral-800 bg-neutral-950 shadow-lg"
        >
          <MenuItem onClick={() => run(onReset)}>Reset this chat</MenuItem>
          <MenuItem onClick={() => run(onPivot)}>
            I&#39;m pivoting&hellip;
          </MenuItem>
          <MenuItem onClick={() => run(onDeleteAll)} destructive>
            Delete all history
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-900 ${
        destructive ? "text-red-400 hover:text-red-300" : "text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}
