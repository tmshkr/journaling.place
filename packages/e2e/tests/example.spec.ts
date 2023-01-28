import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  page.on("dialog", async (dialog) => {
    dialog.accept("testpassword");
  });
});

test("displays AppShell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-test="app-shell"]')).toBeVisible();
});

test("still displays AppShell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-test="app-shell"]')).toBeVisible();
});
