import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MonoCaption } from "@entity/ui/typographic/mono-caption";

describe("MonoCaption", () => {
  it("renders mono text with letter-spacing", () => {
    render(<MonoCaption>07 / 24</MonoCaption>);
    const el = screen.getByText("07 / 24");
    expect(el.className).toContain("font-[family-name:var(--font-mono)]");
    expect(el.className).toContain("tracking-");
  });

  it("accepts muted variant", () => {
    render(<MonoCaption variant="muted">meta</MonoCaption>);
    const el = screen.getByText("meta");
    expect(el.className).toContain("text-[var(--color-muted)]");
  });
});
