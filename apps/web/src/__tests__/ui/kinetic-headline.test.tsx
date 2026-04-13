import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { KineticHeadline } from "@zstar/ui/typographic/kinetic-headline";

vi.mock("@zstar/ui/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, prop: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (props: any) => {
          const { children, ...rest } = props;
          return (
            <div data-testid="motion-el" data-tag={prop} {...rest}>
              {children}
            </div>
          );
        },
    },
  ),
}));

import * as motionHook from "@zstar/ui/hooks/use-reduced-motion";

describe("KineticHeadline", () => {
  beforeEach(() => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
  });

  describe("Path A — reduced-motion preferred", () => {
    it("renders a plain heading (no motion spans) when useReducedMotion is true", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
      render(<KineticHeadline>Hello</KineticHeadline>);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Hello");
      // No motion-el wrappers
      expect(document.querySelectorAll("[data-testid='motion-el']")).toHaveLength(0);
    });

    it("uses h1 by default in fallback path", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
      render(<KineticHeadline>Hello</KineticHeadline>);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  describe("Path B — calm tier", () => {
    it("renders plain Display (no motion) when tier='calm' even if motion is allowed", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      render(<KineticHeadline tier="calm">Hello</KineticHeadline>);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Hello");
      expect(document.querySelectorAll("[data-testid='motion-el']")).toHaveLength(0);
    });

    it("calm tier with as='h2' renders h2 fallback", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      render(
        <KineticHeadline tier="calm" as="h2">
          Hello
        </KineticHeadline>,
      );
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Hello");
    });
  });

  describe("Path C — full tier + motion allowed", () => {
    it("renders per-glyph motion spans for each character", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      render(<KineticHeadline>Hi</KineticHeadline>);
      // "Hi" = 2 chars → 2 aria-hidden spans inside the motion root
      const glyphSpans = document.querySelectorAll("[aria-hidden='true']");
      expect(glyphSpans).toHaveLength(2);
    });

    it("aria-label on the root equals the children text", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      render(<KineticHeadline>Hi</KineticHeadline>);
      const root = document.querySelector("[data-testid='motion-el']");
      expect(root).toHaveAttribute("aria-label", "Hi");
    });

    it("explicit aria-label prop overrides auto-derived label", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      render(<KineticHeadline aria-label="Custom label">Hi</KineticHeadline>);
      const root = document.querySelector("[data-testid='motion-el']");
      expect(root).toHaveAttribute("aria-label", "Custom label");
    });

    it("as='h2' renders motion h2 element in animated path", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      render(<KineticHeadline as="h2">Hi</KineticHeadline>);
      const root = document.querySelector("[data-testid='motion-el']");
      expect(root).toHaveAttribute("data-tag", "h2");
    });

    it("medium tier also animates (only calm suppresses)", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      render(<KineticHeadline tier="medium">Hi</KineticHeadline>);
      const glyphSpans = document.querySelectorAll("[aria-hidden='true']");
      expect(glyphSpans).toHaveLength(2);
    });

    it("reduced-motion overrides full tier — no animation", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
      render(<KineticHeadline tier="full">Hi</KineticHeadline>);
      expect(document.querySelectorAll("[data-testid='motion-el']")).toHaveLength(0);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hi");
    });
  });
});
