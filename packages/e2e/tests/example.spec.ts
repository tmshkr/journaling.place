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

test("persists journal entry", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('[data-test="editor"]');
  await page.waitForSelector('[data-test="network-pending"]');
  await page.waitForSelector('[data-test="network-succeeded"]');
  await page.keyboard.type("Hello from playwright!");
  await page.waitForSelector('[data-test="network-pending"]');
  await page.waitForSelector('[data-test="network-succeeded"]');
  await page.goto("/journal");
  await expect(
    page.locator('[data-test="JournalList-entry"]').first()
  ).toHaveText(/Hello from playwright!/);
});
