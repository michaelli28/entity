import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HairlineCard } from "@entity/ui/surface/hairline-card";

describe("HairlineCard", () => {
  it("renders children", () => {
    render(<HairlineCard>Inside</HairlineCard>);
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("applies hairline border class", () => {
    const { container } = render(<HairlineCard>x</HairlineCard>);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("border");
    expect(root.className).toContain("border-[var(--color-border)]");
  });

  it("renders hover underline when interactive prop is true", () => {
    const { container } = render(<HairlineCard interactive>x</HairlineCard>);
    const underline = container.querySelector("[data-hover-underline]");
    expect(underline).not.toBeNull();
  });
});
