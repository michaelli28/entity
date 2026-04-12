import { expect, test } from "@playwright/test";

// Requires Clerk test mode or pre-authenticated storage state.
// See https://clerk.com/docs/testing/playwright/overview

test("golden path: onboarding → chat → first mentor reply", async ({
  page,
}) => {
  await page.goto("/onboarding");
  await expect(
    page.getByRole("heading", { name: /Welcome to ZStar/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Let's go/i }).click();

  await page.fill('input[name="name"]', "Test Founder");
  await page.fill('input[name="company_name"]', "Acme");
  await page.fill(
    'input[name="one_liner"]',
    "B2B SaaS for accountants doing tax prep",
  );
  await page.selectOption('select[name="stage"]', "seed");
  await page.selectOption(
    'select[name="what_would_make_10x"]',
    "better_coaching",
  );
  await page.getByRole("button", { name: /Continue/i }).click();

  await page.waitForURL(/\/onboarding\/ready/);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: /Start my first conversation/i })
    .click();

  await page.waitForURL(/\/dashboard\/chat/);
  await page
    .getByPlaceholder(/Share what you're working on/i)
    .fill(
      "We help accountants automate tax prep. Our MRR is 8k and we have 12 customers.",
    );
  await page.getByRole("button", { name: "Send" }).click();

  // Wait for mentor reply (streaming).
  await expect(page.locator("div.bg-card").last()).toContainText(/./, {
    timeout: 20000,
  });
});
