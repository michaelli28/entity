import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as useReducedMotionModule from "@zstar/ui/hooks/use-reduced-motion";

// Default mock: no reduced motion
vi.mock("@zstar/ui/hooks/use-reduced-motion", () => ({
  useReducedMotion: () => false,
}));

// jsdom does not define PointerEvent — shim it
if (typeof PointerEvent === "undefined") {
  class PointerEventShim extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }
  vi.stubGlobal("PointerEvent", PointerEventShim);
}

// Use real timers; shim rAF to run immediately via setTimeout(0)
vi.stubGlobal(
  "requestAnimationFrame",
  (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0) as unknown as number,
);
vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));

function stubMatchMedia(pointerFine: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (q: string) => ({
      matches: pointerFine ? q.includes("pointer: fine") : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  stubMatchMedia(true);
  vi.spyOn(useReducedMotionModule, "useReducedMotion").mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Import after stubs
const { CustomCursor } = await import("@zstar/ui/surface/custom-cursor");

describe("CustomCursor", () => {
  it("renders nothing when no enabled prop", () => {
    const { container } = render(<CustomCursor />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when enabled=false", () => {
    const { container } = render(<CustomCursor enabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when reduced-motion is true (even with enabled=true)", async () => {
    vi.spyOn(useReducedMotionModule, "useReducedMotion").mockReturnValue(true);
    const { container } = render(<CustomCursor enabled={true} />);
    // Effect runs asynchronously; disabled stays true because reduced=true
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders nothing when pointer:fine is not matched (coarse device)", async () => {
    stubMatchMedia(false);
    const { container } = render(<CustomCursor enabled={true} />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders cursor element when enabled=true, not reduced-motion, pointer:fine", async () => {
    render(<CustomCursor enabled={true} />);
    await waitFor(() => {
      expect(screen.getByTestId("zstar-cursor")).toBeInTheDocument();
    });
  });

  it("sets --cursor-x and --cursor-y via CSS custom properties on pointermove", async () => {
    render(<CustomCursor enabled={true} />);
    const node = await waitFor(() => screen.getByTestId("zstar-cursor"));

    await act(async () => {
      // Dispatch on the node itself so target is an HTMLElement
      node.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 100,
          clientY: 200,
          bubbles: true,
          cancelable: true,
        }),
      );
      // Let the rAF setTimeout(0) fire
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(node.style.getPropertyValue("--cursor-x")).toBe("100px");
    expect(node.style.getPropertyValue("--cursor-y")).toBe("200px");
  });

  it("sets opacity to '0' when pointermove target is an input element", async () => {
    render(
      <>
        <CustomCursor enabled={true} />
        <input data-testid="text-input" />
      </>,
    );

    const node = await waitFor(() => screen.getByTestId("zstar-cursor"));
    const input = screen.getByTestId("text-input");

    await act(async () => {
      // Dispatch on the input — it's a real HTMLElement so .closest works
      input.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 50,
          clientY: 50,
          bubbles: true,
          cancelable: true,
        }),
      );
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(node.style.opacity).toBe("0");
  });

  it("sets opacity to '1' when pointermove target is a plain div", async () => {
    render(
      <>
        <CustomCursor enabled={true} />
        <div data-testid="plain-div" />
      </>,
    );

    const node = await waitFor(() => screen.getByTestId("zstar-cursor"));
    const div = screen.getByTestId("plain-div");

    await act(async () => {
      div.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 50,
          clientY: 50,
          bubbles: true,
          cancelable: true,
        }),
      );
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(node.style.opacity).toBe("1");
  });
});
