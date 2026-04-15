import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MobileNavDrawer } from "@entity/ui/surface/mobile-nav-drawer";

function renderDrawer(
  props: {
    open?: boolean;
    title?: string;
  } = {},
) {
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  const { open = false, title } = props;

  const result = render(
    <MobileNavDrawer
      open={open}
      onOpenChange={onOpenChange}
      trigger={<button>Open menu</button>}
      title={title}
    >
      <a href="/dashboard">Dashboard</a>
      <a href="/settings">Settings</a>
    </MobileNavDrawer>,
  );

  return { ...result, onOpenChange, user };
}

describe("MobileNavDrawer", () => {
  it("does not show drawer content when open=false", () => {
    renderDrawer({ open: false });
    // Vaul/Radix portals: title should not be visible when closed
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
  });

  it("shows drawer content with default title 'Menu' when open=true", () => {
    renderDrawer({ open: true });
    expect(within(document.body).getByText("Menu")).toBeInTheDocument();
  });

  it("renders children inside the drawer when open=true", () => {
    renderDrawer({ open: true });
    expect(within(document.body).getByText("Dashboard")).toBeInTheDocument();
    expect(within(document.body).getByText("Settings")).toBeInTheDocument();
  });

  it("renders custom title prop when provided", () => {
    renderDrawer({ open: true, title: "Navigation" });
    expect(within(document.body).getByText("Navigation")).toBeInTheDocument();
  });

  it("calls onOpenChange when trigger is clicked", async () => {
    const { onOpenChange, user } = renderDrawer({ open: false });
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenCalled();
  });
});
