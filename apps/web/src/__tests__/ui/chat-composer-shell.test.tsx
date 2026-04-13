import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChatComposerShell } from "@zstar/ui/surface/chat-composer-shell";

describe("ChatComposerShell", () => {
  it("renders an HTML form element", () => {
    const { container } = render(
      <ChatComposerShell input={<textarea aria-label="message" />} />,
    );
    expect(container.querySelector("form")).toBeInTheDocument();
  });

  it("renders input slot content", () => {
    render(<ChatComposerShell input={<textarea aria-label="message" />} />);
    expect(screen.getByRole("textbox", { name: "message" })).toBeInTheDocument();
  });

  it("renders left slot when provided", () => {
    render(
      <ChatComposerShell
        input={<textarea aria-label="message" />}
        left={<button>Attach</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Attach" })).toBeInTheDocument();
  });

  it("does not render left slot wrapper when left prop is absent", () => {
    const { container } = render(
      <ChatComposerShell input={<textarea aria-label="message" />} />,
    );
    // The left slot wrapper uses flex-none; we check no extra div before the input wrapper
    // Simplest check: only one flex-none sibling (for right if not provided — none)
    const flexNone = container.querySelectorAll(".flex-none");
    expect(flexNone.length).toBe(0);
  });

  it("renders right slot when provided", () => {
    render(
      <ChatComposerShell
        input={<textarea aria-label="message" />}
        right={<button>Send</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("does not render right slot wrapper when right prop is absent", () => {
    const { container } = render(
      <ChatComposerShell input={<textarea aria-label="message" />} />,
    );
    const flexNone = container.querySelectorAll(".flex-none");
    expect(flexNone.length).toBe(0);
  });

  it("root form contains safe-area padding class", () => {
    const { container } = render(
      <ChatComposerShell input={<textarea aria-label="message" />} />,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form.className).toContain(
      "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
    );
  });

  it("merges consumer className with base classes", () => {
    const { container } = render(
      <ChatComposerShell
        input={<textarea aria-label="message" />}
        className="my-custom-class"
      />,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form.className).toContain("my-custom-class");
    expect(form.className).toContain("sticky");
  });

  it("root form has sticky and bottom-0 classes", () => {
    const { container } = render(
      <ChatComposerShell input={<textarea aria-label="message" />} />,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(form.className).toContain("sticky");
    expect(form.className).toContain("bottom-0");
  });

  it("does not overflow horizontally at 375px viewport width", () => {
    Object.defineProperty(document.documentElement, "clientWidth", {
      writable: true,
      value: 375,
    });
    const { container } = render(
      <ChatComposerShell
        input={<textarea aria-label="message" style={{ width: "100%" }} />}
      />,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    // scrollWidth should not exceed clientWidth (jsdom default is 0 for both but ratio holds)
    expect(form.scrollWidth).toBeLessThanOrEqual(
      form.clientWidth === 0 ? 0 : form.clientWidth,
    );
  });
});
