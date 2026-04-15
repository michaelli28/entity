import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DotPulse } from "@entity/ui/surface/dot-pulse";

vi.mock("@entity/ui/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

import * as motionHook from "@entity/ui/hooks/use-reduced-motion";

describe("DotPulse", () => {
  beforeEach(() => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
  });

  it("renders role=status with default label 'Active'", () => {
    render(<DotPulse />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Active");
  });

  it("custom label prop sets aria-label", () => {
    render(<DotPulse label="Streaming" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Streaming");
  });

  it("size='sm' renders smaller width class w-1.5", () => {
    render(<DotPulse size="sm" />);
    const dot = screen.getByRole("status").querySelector("[aria-hidden='true']");
    expect(dot?.className).toContain("w-1.5");
  });

  it("size='md' (default) renders w-2 class", () => {
    render(<DotPulse />);
    const dot = screen.getByRole("status").querySelector("[aria-hidden='true']");
    expect(dot?.className).toContain("w-2");
  });

  it("tone='success' renders emerald color class", () => {
    render(<DotPulse tone="success" />);
    const dot = screen.getByRole("status").querySelector("[aria-hidden='true']");
    expect(dot?.className).toContain("bg-emerald-400");
  });

  it("tone='brand' (default) renders brand-purple color class", () => {
    render(<DotPulse />);
    const dot = screen.getByRole("status").querySelector("[aria-hidden='true']");
    expect(dot?.className).toContain("bg-[var(--color-brand-purple)]");
  });

  it("tone='neutral' renders muted color class", () => {
    render(<DotPulse tone="neutral" />);
    const dot = screen.getByRole("status").querySelector("[aria-hidden='true']");
    expect(dot?.className).toContain("bg-[var(--color-text-muted)]");
  });

  it("when useReducedMotion is false, dot has entity-dot-pulse class", () => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
    render(<DotPulse />);
    const dot = screen.getByRole("status").querySelector("[aria-hidden='true']");
    expect(dot?.className).toContain("entity-dot-pulse");
  });

  it("when useReducedMotion is true, dot does NOT have entity-dot-pulse class", () => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
    render(<DotPulse />);
    const dot = screen.getByRole("status").querySelector("[aria-hidden='true']");
    expect(dot?.className).not.toContain("entity-dot-pulse");
  });
});
