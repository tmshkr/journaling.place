import { test, expect } from "@playwright/test";

test("displays AppShell", async ({ page }) => {
  await page.goto("/");
  page.on("dialog", async (dialog) => {
    dialog.accept("testpassword");
  });
  await expect(page.locator('[data-test="app-shell"]')).toBeVisible();
});
