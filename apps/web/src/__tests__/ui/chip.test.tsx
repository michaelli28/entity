import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Chip } from "@zstar/ui/surface/chip";

describe("Chip", () => {
  it("renders as span by default", () => {
    const { container } = render(<Chip>live</Chip>);
    expect(container.firstChild?.nodeName).toBe("SPAN");
    expect(screen.getByText("live")).toBeInTheDocument();
  });

  it("renders as button when onClick is passed", () => {
    const { container } = render(<Chip onClick={() => {}}>click</Chip>);
    expect(container.firstChild?.nodeName).toBe("BUTTON");
  });

  it("applies mono font and hairline border", () => {
    const { container } = render(<Chip>x</Chip>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("font-[family-name:var(--font-mono)]");
    expect(el.className).toContain("border-[var(--color-border-interactive)]");
  });
});
