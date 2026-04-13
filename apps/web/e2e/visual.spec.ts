import { test, expect } from "@playwright/test";

// Unauthenticated surfaces only — authenticated ones need Clerk test-mode setup (deferred to Phase 3).
const surfaces = [
  { name: "marketing-home", path: "/" },
  { name: "showcase", path: "/showcase" },
  { name: "sign-in", path: "/sign-in" },
  { name: "terms", path: "/terms" },
];

for (const s of surfaces) {
  test(`visual: ${s.name}`, async ({ page }) => {
    await page.goto(s.path);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${s.name}.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });
}
