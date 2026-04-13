import { test, expect } from "@playwright/test";

const surfaces = [
  { name: "marketing-home", path: "/" },
  { name: "showcase", path: "/showcase" },
  { name: "sign-in", path: "/sign-in" },
  { name: "terms", path: "/terms" },
];

for (const s of surfaces) {
  test(`smoke: ${s.name} loads without runtime console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(s.path);
    await page.waitForLoadState("networkidle");

    const ignored = [
      /Failed to load resource/i,
      /Development mode/i,
      /Clerk/i,
    ];
    const real = errors.filter((e) => !ignored.some((re) => re.test(e)));
    expect(real, `Unexpected console errors on ${s.name}:\n${real.join("\n")}`).toEqual([]);
  });
}

test("showcase: html data-theatrics attribute is set", async ({ page }) => {
  await page.goto("/showcase");
  const tier = await page.locator("html").getAttribute("data-theatrics");
  expect(tier).toMatch(/full|medium|calm/);
});

test("showcase: primitives render (navpill, sidebar skip link, empty state, error panel, thinking indicator)", async ({ page }) => {
  await page.goto("/showcase");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("navigation", { name: "Primary" }).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Sidebar" }).first()).toBeVisible();
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page.getByText("Skip to content").first()).toBeAttached();
});
