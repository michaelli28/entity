import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Chip } from "./chip";

describe("Chip (source test)", () => {
  it("renders children", () => {
    render(<Chip>Hello</Chip>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
