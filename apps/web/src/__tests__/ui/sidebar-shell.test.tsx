import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SidebarShell } from "@entity/ui/surface/sidebar-shell";

describe("SidebarShell", () => {
  it("renders role=navigation with aria-label=Sidebar", () => {
    render(<SidebarShell nav={<div>nav content</div>} />);
    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();
  });

  it("renders nav slot content", () => {
    render(<SidebarShell nav={<a href="/home">Home</a>} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders header slot when provided", () => {
    render(<SidebarShell nav={<div />} header={<span>Logo</span>} />);
    expect(screen.getByText("Logo")).toBeInTheDocument();
  });

  it("does not render header slot when not provided", () => {
    render(<SidebarShell nav={<div>nav</div>} />);
    expect(screen.queryByTestId("sidebar-header")).not.toBeInTheDocument();
  });

  it("renders footer slot when provided", () => {
    render(<SidebarShell nav={<div />} footer={<span>Footer</span>} />);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("does not render footer slot when not provided", () => {
    render(<SidebarShell nav={<div>nav</div>} />);
    expect(screen.queryByTestId("sidebar-footer")).not.toBeInTheDocument();
  });

  it("renders skip link with default href=#main", () => {
    render(<SidebarShell nav={<div />} />);
    expect(screen.getByText("Skip to content")).toHaveAttribute("href", "#main");
  });

  it("uses custom mainId for skip link href", () => {
    render(<SidebarShell nav={<div />} mainId="root" />);
    expect(screen.getByText("Skip to content")).toHaveAttribute("href", "#root");
  });

  it("applies w-16 when collapsed=true", () => {
    render(<SidebarShell nav={<div />} collapsed />);
    const aside = screen.getByRole("navigation", { name: "Sidebar" });
    expect(aside.className).toContain("w-16");
  });

  it("applies w-64 by default", () => {
    render(<SidebarShell nav={<div />} />);
    const aside = screen.getByRole("navigation", { name: "Sidebar" });
    expect(aside.className).toContain("w-64");
  });

  it("merges consumer className", () => {
    render(<SidebarShell nav={<div />} className="custom-class" />);
    const aside = screen.getByRole("navigation", { name: "Sidebar" });
    expect(aside.className).toContain("custom-class");
  });
});
