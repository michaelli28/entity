import "vitest-axe/extend-expect";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, it, expect } from "vitest";
import {
  Chip,
  EmptyState,
  ErrorPanel,
  NavPill,
  SidebarShell,
  DotPulse,
  LoadingShimmer,
  ThinkingIndicator,
  HairlineCard,
  StatCard,
} from "@entity/ui";

describe("a11y: primitive suite", () => {
  it("Chip has no axe violations", async () => {
    const { container } = render(<Chip>Chip</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EmptyState has no axe violations", async () => {
    const { container } = render(
      <EmptyState title="Nothing yet" body="Try again later" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ErrorPanel has no axe violations", async () => {
    const { container } = render(
      <ErrorPanel title="Error" detail="Something failed" retry={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("NavPill has no axe violations", async () => {
    const { container } = render(
      <NavPill
        items={[
          { href: "/", label: "Home", active: true },
          { href: "/b", label: "Two" },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SidebarShell has no axe violations", async () => {
    const { container } = render(<SidebarShell nav={<a href="/x">Link</a>} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("DotPulse has no axe violations", async () => {
    const { container } = render(<DotPulse label="Streaming" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("LoadingShimmer has no axe violations", async () => {
    const { container } = render(<LoadingShimmer />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ThinkingIndicator has no axe violations", async () => {
    const { container } = render(<ThinkingIndicator />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("HairlineCard has no axe violations", async () => {
    const { container } = render(<HairlineCard>Content</HairlineCard>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatCard has no axe violations", async () => {
    const { container } = render(<StatCard label="x" value="1" fill={0.5} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
