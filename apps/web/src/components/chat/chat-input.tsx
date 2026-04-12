"use client";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { type KeyboardEvent, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
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
  return (
    <div className="border-t border-white/10 p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          disabled={disabled}
          placeholder="Share what you're working on..."
          className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled === true || !value.trim()}
          aria-label="Send"
          className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-40"
        >
          <PaperPlaneRight weight="fill" size={18} />
        </button>
      </div>
    </div>
  );
}
