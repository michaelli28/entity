"use client";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    const v = value.trim();
    if (!v || disabled) return;
    onSend(v);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="zs-chat-input">
      <div className="zs-chat-input__row">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          disabled={disabled}
          placeholder="Share what you&rsquo;re working on…"
          className="zs-chat-input__textarea"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className="zs-chat-input__send"
        >
          <PaperPlaneRight weight="fill" size={16} />
        </button>
      </div>
      <p className="zs-chat-input__hint">
        <span><kbd>↵</kbd> to send</span>
        <span aria-hidden="true" className="zs-chat-input__hint-sep">·</span>
        <span><kbd>⇧ ↵</kbd> for new line</span>
      </p>
    </div>
  );
}
