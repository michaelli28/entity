import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { ErrorPanel } from "@entity/ui/surface/error-panel";

describe("ErrorPanel", () => {
  it("renders role=alert", () => {
    render(<ErrorPanel title="Something went wrong" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<ErrorPanel title="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders detail when provided", () => {
    render(<ErrorPanel title="Error" detail={<p>Check your connection.</p>} />);
    expect(screen.getByText("Check your connection.")).toBeInTheDocument();
  });

  it("renders retry button with default label Try again", () => {
    render(<ErrorPanel title="Error" retry={() => {}} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("renders retry button with custom retryLabel", () => {
    render(<ErrorPanel title="Error" retry={() => {}} retryLabel="Retry now" />);
    expect(screen.getByRole("button", { name: "Retry now" })).toBeInTheDocument();
  });

  it("calls retry handler on button click", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<ErrorPanel title="Error" retry={retry} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("does not render button when retry not provided", () => {
    render(<ErrorPanel title="Error" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("merges consumer className", () => {
    render(<ErrorPanel title="Error" className="custom-class" />);
    expect(screen.getByRole("alert").className).toContain("custom-class");
  });
});
