import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Eyebrow } from "@entity/ui/typographic/eyebrow";

describe("Eyebrow", () => {
  it("renders uppercase mono text", () => {
    render(<Eyebrow>Workspace</Eyebrow>);
    const el = screen.getByText("Workspace");
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("font-[family-name:var(--font-mono)]");
  });

  it("renders a leading hairline bar as sibling", () => {
    const { container } = render(<Eyebrow>Signals</Eyebrow>);
    const bar = container.querySelector("[data-eyebrow-bar]");
    expect(bar).not.toBeNull();
  });
});
