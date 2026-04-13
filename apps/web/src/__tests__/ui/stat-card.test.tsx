import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "@zstar/ui/surface/stat-card";

describe("StatCard", () => {
  it("renders label, value, and fill bar", () => {
    render(<StatCard label="Sessions" value="12" fill={0.75} />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    const bar = screen.getByTestId("stat-fill");
    expect(bar.style.getPropertyValue("--w")).toBe("75%");
  });

  it("clamps fill to 0..1", () => {
    render(<StatCard label="x" value="1" fill={1.5} />);
    expect(screen.getByTestId("stat-fill").style.getPropertyValue("--w")).toBe("100%");
  });

  it("applies solid color class when `emphasis` is set", () => {
    render(<StatCard label="Score" value="87" emphasis fill={0.5} />);
    const value = screen.getByText("87");
    expect(value.className).toContain("text-[var(--color-brand-purple-light)]");
  });
});
