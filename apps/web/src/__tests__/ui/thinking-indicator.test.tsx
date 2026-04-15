import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThinkingIndicator } from "@entity/ui/surface/thinking-indicator";

vi.mock("@entity/ui/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

import * as motionHook from "@entity/ui/hooks/use-reduced-motion";

describe("ThinkingIndicator", () => {
  beforeEach(() => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
  });

  it("renders role='status' on the root element", () => {
    render(<ThinkingIndicator />);
    // Get the ThinkingIndicator root — it has role=status and the default label
    expect(screen.getByRole("status", { name: "Mentor is thinking" })).toBeInTheDocument();
  });

  it("default aria-label is 'Mentor is thinking'", () => {
    render(<ThinkingIndicator />);
    const el = screen.getByRole("status", { name: "Mentor is thinking" });
    expect(el).toHaveAttribute("aria-label", "Mentor is thinking");
  });

  it("custom label prop overrides the default aria-label", () => {
    render(<ThinkingIndicator label="Processing your request" />);
    expect(
      screen.getByRole("status", { name: "Processing your request" }),
    ).toBeInTheDocument();
  });

  it("renders exactly 3 dot wrapper children in the root", () => {
    const { container } = render(<ThinkingIndicator />);
    // Count direct child elements of the root status span
    const root = container.firstChild as HTMLElement;
    const directChildren = Array.from(root.children);
    expect(directChildren).toHaveLength(3);
  });

  it("accepts and forwards className to root span", () => {
    const { container } = render(<ThinkingIndicator className="mt-2" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("mt-2");
  });
});
