import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "@zstar/ui/surface/empty-state";

describe("EmptyState", () => {
  it("renders title always", () => {
    render(<EmptyState title="No threads yet" />);
    expect(screen.getByText("No threads yet")).toBeInTheDocument();
  });

  it("renders role=status on root", () => {
    render(<EmptyState title="No data" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders eyebrow when provided", () => {
    render(<EmptyState title="No data" eyebrow="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("omits eyebrow when not provided", () => {
    render(<EmptyState title="No data" />);
    expect(screen.queryByText("Empty")).not.toBeInTheDocument();
  });

  it("renders body when provided", () => {
    render(<EmptyState title="No data" body={<p>Start by creating a thread.</p>} />);
    expect(screen.getByText("Start by creating a thread.")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(<EmptyState title="No data" action={<button>Create thread</button>} />);
    expect(screen.getByRole("button", { name: "Create thread" })).toBeInTheDocument();
  });

  it("merges consumer className", () => {
    render(<EmptyState title="No data" className="custom-class" />);
    expect(screen.getByRole("status").className).toContain("custom-class");
  });
});
