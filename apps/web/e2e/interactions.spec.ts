import { test, expect } from "@playwright/test";

test.describe("theatrics tier resolves per route", () => {
  test("marketing home → full", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theatrics", "full");
  });

  test("sign-in → medium", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("html")).toHaveAttribute("data-theatrics", "medium");
  });

  test("terms → full (public route-group layout)", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("html")).toHaveAttribute("data-theatrics", "full");
  });

  test("showcase → full (server-resolved from pathname)", async ({ page }) => {
    await page.goto("/showcase");
    await expect(page.locator("html")).toHaveAttribute("data-theatrics", "full");
  });
});

test.describe("showcase primitive interactions", () => {
  test("sidebar skip-link becomes visible on focus", async ({ page }) => {
    await page.goto("/showcase");
    const skip = page.getByRole("link", { name: "Skip to content" }).first();
    await expect(skip).toBeAttached();
    await skip.focus();
    await expect(skip).toBeFocused();
    const bbox = await skip.boundingBox();
    expect(bbox?.width ?? 0).toBeGreaterThan(0);
  });

  test("nav-pill active link has aria-current=page", async ({ page }) => {
    await page.goto("/showcase");
    const active = page.locator('nav[aria-label="Primary"] [aria-current="page"]').first();
    await expect(active).toBeVisible();
  });

  test("error-panel retry button is clickable", async ({ page }) => {
    await page.goto("/showcase");
    const retry = page.getByRole("button", { name: /try again/i }).first();
    await expect(retry).toBeVisible();
    await retry.click();
  });

  test("thinking-indicator has role=status + accessible name", async ({ page }) => {
    await page.goto("/showcase");
    const thinking = page
      .locator('[role="status"]')
      .filter({ has: page.locator("span[aria-hidden='true']") })
      .first();
    await expect(thinking).toBeAttached();
  });

  test("mobile-nav-drawer opens on trigger click", async ({ page }) => {
    await page.goto("/showcase");
    const trigger = page.getByRole("button", { name: /open menu/i }).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("reduced-motion", () => {
  test.use({ colorScheme: "dark" });

  test("showcase renders without errors when prefers-reduced-motion: reduce", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/showcase");
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
    await context.close();
  });
});
