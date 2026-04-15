import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ScrollReveal } from "@entity/ui/surface/scroll-reveal";

vi.mock("@entity/ui/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

const mockUseInView = vi.fn(() => false);
vi.mock("motion/react", () => ({
  useInView: () => mockUseInView(),
}));

import * as motionHook from "@entity/ui/hooks/use-reduced-motion";

function setCSS(supports: boolean) {
  (globalThis as Record<string, unknown>).CSS = { supports: () => supports };
}

describe("ScrollReveal", () => {
  beforeEach(() => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
    mockUseInView.mockReturnValue(false);
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).CSS;
  });

  describe("Path A — reduced-motion preferred", () => {
    it("renders children with no scroll-reveal class when reduced-motion is true", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
      setCSS(true);
      const { container } = render(
        <ScrollReveal>
          <p>Content</p>
        </ScrollReveal>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain("entity-scroll-reveal");
    });

    it("renders children with no inline transform when reduced-motion is true", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
      setCSS(false);
      const { container } = render(
        <ScrollReveal>
          <p>Content</p>
        </ScrollReveal>,
      );
      const wrapper = container.firstChild as HTMLElement;
      const style = wrapper.getAttribute("style") ?? "";
      expect(style).not.toContain("transform");
    });

    it("still renders children when reduced-motion is true", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
      setCSS(true);
      const { container } = render(
        <ScrollReveal>
          <p data-testid="child">Content</p>
        </ScrollReveal>,
      );
      expect(container.querySelector("[data-testid='child']")).toBeInTheDocument();
    });
  });

  describe("Path B — CSS animation-timeline supported", () => {
    it("renders .entity-scroll-reveal class when CSS.supports returns true", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      setCSS(true);
      const { container } = render(
        <ScrollReveal>
          <p>Content</p>
        </ScrollReveal>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("entity-scroll-reveal");
    });

    it("renders as configured element tag", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      setCSS(true);
      const { container } = render(
        <ScrollReveal as="section">
          <p>Content</p>
        </ScrollReveal>,
      );
      expect(container.querySelector("section")).toBeInTheDocument();
    });
  });

  describe("Path C — JS fallback (no CSS animation-timeline)", () => {
    it("has inline opacity and transform style when not in view", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      mockUseInView.mockReturnValue(false);
      setCSS(false);
      const { container } = render(
        <ScrollReveal distance={24}>
          <p>Content</p>
        </ScrollReveal>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.opacity).toBe("0");
      expect(wrapper.style.transform).toContain("translateY(24px)");
    });

    it("has transform: none and opacity 1 when in view", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      mockUseInView.mockReturnValue(true);
      setCSS(false);
      const { container } = render(
        <ScrollReveal>
          <p>Content</p>
        </ScrollReveal>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.opacity).toBe("1");
      expect(wrapper.style.transform).toBe("none");
    });

    it("no .entity-scroll-reveal class on JS fallback path", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      mockUseInView.mockReturnValue(false);
      setCSS(false);
      const { container } = render(
        <ScrollReveal>
          <p>Content</p>
        </ScrollReveal>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain("entity-scroll-reveal");
    });
  });
});
