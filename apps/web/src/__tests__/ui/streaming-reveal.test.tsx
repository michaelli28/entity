import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreamingReveal } from "@zstar/ui/surface/streaming-reveal";

vi.mock("@zstar/ui/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, _prop: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (props: any) => {
          const { children, ...rest } = props;
          return (
            <span data-testid="motion-span" {...rest}>
              {children}
            </span>
          );
        },
    },
  ),
}));

import * as motionHook from "@zstar/ui/hooks/use-reduced-motion";

describe("StreamingReveal", () => {
  beforeEach(() => {
    vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
  });

  describe("reduced-motion fallback", () => {
    it("renders plain span with full text when reduced-motion is true", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(true);
      const { container } = render(<StreamingReveal text="Hello world" />);
      const root = container.firstChild as HTMLElement;
      expect(root.tagName).toBe("SPAN");
      expect(root.textContent).toBe("Hello world");
      expect(container.querySelectorAll("[data-testid='motion-span']")).toHaveLength(0);
    });
  });

  describe("staticMode fallback", () => {
    it("renders plain span with full text when staticMode is true", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      const { container } = render(<StreamingReveal text="Hello world" staticMode />);
      const root = container.firstChild as HTMLElement;
      expect(root.tagName).toBe("SPAN");
      expect(root.textContent).toBe("Hello world");
      expect(container.querySelectorAll("[data-testid='motion-span']")).toHaveLength(0);
    });
  });

  describe("animated path", () => {
    it("renders tokenized motion spans for multi-word text", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      const { container } = render(<StreamingReveal text="Hello world" />);
      // "Hello world" split by /(\s+)/ => ["Hello", " ", "world"] => 3 tokens
      const motionSpans = container.querySelectorAll("[data-testid='motion-span']");
      expect(motionSpans.length).toBeGreaterThan(1);
    });

    it("applies className to the root span", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      const { container } = render(
        <StreamingReveal text="Hello" className="my-custom-class" />,
      );
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain("my-custom-class");
    });

    it("renders single word as motion span", () => {
      vi.mocked(motionHook.useReducedMotion).mockReturnValue(false);
      const { container } = render(<StreamingReveal text="Hello" />);
      const motionSpans = container.querySelectorAll("[data-testid='motion-span']");
      expect(motionSpans.length).toBe(1);
    });
  });
});
