import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NavPill } from "@zstar/ui/surface/nav-pill";
import type { NavPillItem } from "@zstar/ui/surface/nav-pill";

const items: NavPillItem[] = [
  { href: "/", label: "Home", active: false },
  { href: "/about", label: "About", active: false },
  { href: "/pricing", label: "Pricing", active: true },
  { href: "/blog", label: "Blog", active: false },
];

describe("NavPill", () => {
  it("renders a nav with aria-label='Primary'", () => {
    render(<NavPill items={items} />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("renders one link per item with correct href and label", () => {
    render(<NavPill items={items} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(items.length);
    expect(links[0]).toHaveAttribute("href", "/");
    expect(links[0]).toHaveTextContent("Home");
    expect(links[1]).toHaveAttribute("href", "/about");
    expect(links[2]).toHaveAttribute("href", "/pricing");
    expect(links[3]).toHaveAttribute("href", "/blog");
  });

  it("active item has aria-current='page'; inactive items do not", () => {
    render(<NavPill items={items} />);
    const links = screen.getAllByRole("link");
    expect(links[2]).toHaveAttribute("aria-current", "page");
    expect(links[0]).not.toHaveAttribute("aria-current");
    expect(links[1]).not.toHaveAttribute("aria-current");
    expect(links[3]).not.toHaveAttribute("aria-current");
  });

  it("active item contains solid underline span", () => {
    render(<NavPill items={items} />);
    const activeLink = screen.getByRole("link", { name: "Pricing" });
    const underlineSpan = activeLink.querySelector(
      "[class*='bg-\\[color\\:var\\(--color-brand-purple-light\\)\\]']",
    );
    expect(underlineSpan).toBeInTheDocument();
    expect(underlineSpan).toHaveAttribute("aria-hidden", "true");
  });

  it("focus-visible outline class is present on each link", () => {
    render(<NavPill items={items} />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.className).toContain("focus-visible:outline-2");
    }
  });

  it("renderLink prop replaces the anchor with a custom wrapper", () => {
    const renderLink = (item: NavPillItem, children: React.ReactNode) => (
      <a href={item.href} data-testid="custom-link" key={item.href}>
        {children}
      </a>
    );
    render(<NavPill items={items} renderLink={renderLink} />);
    const customLinks = screen.getAllByTestId("custom-link");
    expect(customLinks).toHaveLength(items.length);
  });

  it("items are tab-reachable: Tab moves focus to second link", async () => {
    const user = userEvent.setup();
    render(<NavPill items={items} />);
    const links = screen.getAllByRole("link");
    // Focus first link manually
    links[0].focus();
    expect(document.activeElement).toBe(links[0]);
    // Tab once → second link
    await user.tab();
    expect(document.activeElement).toBe(links[1]);
  });
});
