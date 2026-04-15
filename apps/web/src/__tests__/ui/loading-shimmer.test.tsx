import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoadingShimmer } from "@entity/ui/surface/loading-shimmer";

vi.mock("@entity/ui/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

import * as motionHook from "@entity/ui/hooks/use-reduced-motion";

describe("LoadingShimmer", () => {
  beforeEach(() => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
  });

  it("renders role=status with default aria-label Loading", () => {
    render(<LoadingShimmer />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("renders custom aria-label from label prop", () => {
    render(<LoadingShimmer label="Loading messages" />);
    expect(screen.getByRole("status", { name: "Loading messages" })).toBeInTheDocument();
  });

  it("applies entity-shimmer class when useReducedMotion returns false", () => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
    render(<LoadingShimmer />);
    expect(screen.getByRole("status").className).toContain("entity-shimmer");
  });

  it("does NOT apply entity-shimmer when useReducedMotion returns true", () => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
    render(<LoadingShimmer />);
    expect(screen.getByRole("status").className).not.toContain("entity-shimmer");
  });

  it("applies width and height inline styles", () => {
    render(<LoadingShimmer width="200px" height="2rem" />);
    const el = screen.getByRole("status");
    expect(el).toHaveStyle({ width: "200px", height: "2rem" });
  });

  it("applies rounded-full when rounded=full", () => {
    render(<LoadingShimmer rounded="full" />);
    expect(screen.getByRole("status").className).toContain("rounded-full");
  });

  it("merges consumer className", () => {
    render(<LoadingShimmer className="custom-class" />);
    expect(screen.getByRole("status").className).toContain("custom-class");
  });
});
