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
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div className="en-chat-menu" ref={ref}>
      <button
        type="button"
        aria-label="Chat options"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="en-chat-menu__toggle"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="3.5" cy="8" r="1.25" fill="currentColor" />
          <circle cx="8" cy="8" r="1.25" fill="currentColor" />
          <circle cx="12.5" cy="8" r="1.25" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="en-chat-menu__panel">
          <button
            type="button"
            role="menuitem"
            className="en-chat-menu__item"
            onClick={() => run(onReset)}
          >
            Reset this chat
          </button>
          <button
            type="button"
            role="menuitem"
            className="en-chat-menu__item"
            onClick={() => run(onPivot)}
          >
            I&rsquo;m pivoting…
          </button>
          <button
            type="button"
            role="menuitem"
            data-destructive
            className="en-chat-menu__item"
            onClick={() => run(onDeleteAll)}
          >
            Delete all history
          </button>
        </div>
      )}
    </div>
  );
}
