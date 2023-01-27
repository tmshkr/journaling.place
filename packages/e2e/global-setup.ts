// global-setup.ts
import { chromium, expect, FullConfig } from "@playwright/test";
import { mongoClient } from "common/mongo";

export async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  await page.goto(process.env.NEXTAUTH_URL);
  await page.locator('[data-test="sign-in-button"]').click();
  await page
    .locator("[id=input-email-for-email-provider]")
    .fill("test@journaling.place");
  await page.locator("[type=submit]").click();
  const doc = await mongoClient
    .db()
    .collection("testing")
    .findOneAndDelete({ _id: "test@journaling.place" });
  await page.goto(doc.value.url);

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
  await browser.close();
}

export default globalSetup;
