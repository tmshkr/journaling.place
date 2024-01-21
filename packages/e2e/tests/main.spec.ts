import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  await page.goto("/");
  const passwordInput = await page.locator("#password");
  await passwordInput.waitFor();
  await passwordInput.fill("testpassword");
  await page.click("#password_submit");

  const createPasswordTitle = await page.getByText("Create Password");
  const isCreatePasswordTitleVisible = await createPasswordTitle.isVisible();

  if (isCreatePasswordTitleVisible) {
    const confirmPasswordInput = await page.locator("#confirm_password");
    await confirmPasswordInput.waitFor();
    await confirmPasswordInput.fill("testpassword");
    await page.click("#password_submit");
  }

  await page.locator("#password_submit").waitFor({ state: "detached" });
});

test("user can view AppShell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-test="app-shell"]')).toBeVisible();
  await sleep(1000);
});

test("user can persist journal entry", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('[data-test="editor"]');
  await page.waitForSelector('[data-test="network-pending"]');
  await page.waitForSelector('[data-test="network-succeeded"]');

  const text = `Hello from playwright! ${Date.now()}`;
  await page.keyboard.type(text);
  await page.waitForSelector('[data-test="network-pending"]');
  await page.waitForSelector('[data-test="network-succeeded"]');
  await page.goto("/journal");
  await expect(
    page.locator('[data-test="JournalList-entry"]').getByText(new RegExp(text))
  ).toBeTruthy();
  await sleep(1000);
});

test("user can change password", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('[data-test="editor"]');
  await page.waitForSelector('[data-test="network-pending"]');
  await page.waitForSelector('[data-test="network-succeeded"]');

  const text = `change password test entry ${Date.now()}`;
  await page.keyboard.type(text);

  await page.waitForSelector('[data-test="network-pending"]');
  await page.waitForSelector('[data-test="network-succeeded"]');

  await page.goto("/settings");
  await page.fill('[data-test="current-password"]', "testpassword");
  await page.fill('[data-test="new-password"]', "testpassword");
  await page.fill('[data-test="confirm-password"]', "testpassword");
  await page.click('[data-test="update-password"]');
  await page.waitForSelector('[data-test="update-password-success"]');

  await page.goto("/journal");
  await expect(
    page.locator('[data-test="JournalList-entry"]').getByText(new RegExp(text))
  ).toBeTruthy();
  await sleep(1000);
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
