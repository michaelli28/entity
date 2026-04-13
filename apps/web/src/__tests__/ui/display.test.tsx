import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Display } from "@zstar/ui/typographic/display";

describe("Display", () => {
  it("renders children as h1 by default", () => {
    render(<Display>Hello</Display>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello");
  });

  it("renders as configured level when `as` prop set", () => {
    render(<Display as="h2">Sub</Display>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Sub");
  });

  it("renders <em> children as plain italic text", () => {
    const { container } = render(
      <Display>
        Welcome <em>back</em>
      </Display>
    );
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(em?.textContent).toBe("back");
  });
});
