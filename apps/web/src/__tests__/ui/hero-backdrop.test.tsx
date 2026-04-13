import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HeroBackdrop } from "@zstar/ui/surface/hero-backdrop";

describe("HeroBackdrop", () => {
  it("renders children on top", () => {
    render(<HeroBackdrop><p>hero content</p></HeroBackdrop>);
    expect(screen.getByText("hero content")).toBeInTheDocument();
  });

  it("default intensity='full' applies no opacity modifier", () => {
    const { container } = render(<HeroBackdrop />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain("opacity-60");
    // inner layers should also not have opacity-60
    const inner = wrapper.querySelectorAll("[class*='opacity-60']");
    expect(inner).toHaveLength(0);
  });

  it("intensity='soft' applies opacity-60 to inner layers", () => {
    const { container } = render(<HeroBackdrop intensity="soft" />);
    const wrapper = container.firstChild as HTMLElement;
    const opacityLayers = wrapper.querySelectorAll("[class*='opacity-60']");
    expect(opacityLayers.length).toBeGreaterThan(0);
  });

  it("merges consumer className onto wrapper", () => {
    const { container } = render(<HeroBackdrop className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-class");
  });
});
