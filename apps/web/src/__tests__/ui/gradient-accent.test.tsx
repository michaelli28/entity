import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GradientAccent } from "@zstar/ui/surface/gradient-accent";

describe("GradientAccent", () => {
  it("renders as span by default", () => {
    const { container } = render(<GradientAccent>Hello</GradientAccent>);
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });

  it("has zstar-gradient-static class by default", () => {
    const { container } = render(<GradientAccent>Hello</GradientAccent>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("zstar-gradient-static");
  });

  it("as='em' renders em element with zstar-gradient-static class", () => {
    const { container } = render(<GradientAccent as="em">Emphasis</GradientAccent>);
    expect(container.firstChild?.nodeName).toBe("EM");
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("zstar-gradient-static");
  });

  it("as='strong' renders strong element", () => {
    const { container } = render(<GradientAccent as="strong">Bold</GradientAccent>);
    expect(container.firstChild?.nodeName).toBe("STRONG");
  });

  it("forwards className prop (merged, not replaced)", () => {
    const { container } = render(
      <GradientAccent className="custom-class">Text</GradientAccent>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("zstar-gradient-static");
    expect(el.className).toContain("custom-class");
  });

  it("renders children text", () => {
    render(<GradientAccent>gradient text</GradientAccent>);
    expect(screen.getByText("gradient text")).toBeInTheDocument();
  });
});
