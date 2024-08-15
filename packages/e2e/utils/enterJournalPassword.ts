import { Page } from "playwright";
const { CF_SKIP_TOKEN } = process.env;
export async function enterJournalPassword(page: Page) {
  await page.route("**", (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        "x-cf-skip-token": CF_SKIP_TOKEN,
      },
    });
  });

  const passwordInput = await page.locator("#password");
  const submitButton = await page.locator("#password_submit");
  await submitButton.waitFor();

  const createPasswordTitle = await page.getByText("Create Password");
  const creatingPassword = await createPasswordTitle.isVisible();

  await passwordInput.fill("testpassword");
  await submitButton.click();

  if (creatingPassword) {
    const confirmPasswordInput = await page.locator("#confirm_password");
    await confirmPasswordInput.waitFor();
    await confirmPasswordInput.fill("testpassword");
    await submitButton.click();
  }

  await submitButton.waitFor({ state: "detached" });

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
}
