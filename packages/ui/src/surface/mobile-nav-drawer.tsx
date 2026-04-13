"use client";
import * as React from "react";
import { Drawer } from "vaul";

interface MobileNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  title?: string;
  children: React.ReactNode;
}

export function MobileNavDrawer({
  open,
  onOpenChange,
  trigger,
  title = "Menu",
  children,
}: MobileNavDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex h-[80vh] flex-col rounded-t-2xl border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)] outline-none">
          <div
            className="mx-auto mt-3 h-1.5 w-10 flex-none rounded-full bg-[color:var(--color-border)]"
            aria-hidden="true"
          />
          <Drawer.Title className="px-6 pt-4 pb-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
            {title}
          </Drawer.Title>
          <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
