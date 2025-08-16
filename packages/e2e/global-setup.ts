import { chromium, FullConfig } from "@playwright/test";
import { MongoClient } from "mongodb";
import { enterJournalPassword } from "./utils/enterJournalPassword";

const { TEST_USER_EMAIL } = process.env;
const baseURL = new URL(process.env.BASE_URL || process.env.NEXTAUTH_URL);

async function checkVersion(baseURL: URL) {
  const maxAttempts = 100;
  const url = new URL("/api/info", baseURL);
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      const { version } = await fetch(url).then((res) => res.json());
      if (version !== process.env.VERSION_LABEL) {
        throw new Error(
          `Version mismatch: ${version} (server) !== ${process.env.VERSION_LABEL} (client)`
        );
      }
      return version;
    } catch (err) {
      console.error(err.message);
      for (const key in err) {
        console.error(key, err[key]);
      }
      if (attempts >= maxAttempts) throw err;
      console.log(`Attempt ${attempts}: Retrying in 10 seconds...`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }
}

async function getMongoClient() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  const mongoClient = new MongoClient(process.env.MONGO_URI as string);
  await mongoClient.connect().then(() => {
    console.log("Connected to MongoDB");
  });

  return mongoClient;
}

async function globalSetup(config: FullConfig) {
  await checkVersion(baseURL);
  const mongoClient = await getMongoClient();

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseURL}/api/auth/signin`);

  await page
    .locator("[id=input-email-for-email-provider]")
    .fill(TEST_USER_EMAIL);
  await page.locator("[type=submit]").click();
  const doc = await mongoClient
    .db()
    .collection("testing")
    .findOneAndDelete({ _id: TEST_USER_EMAIL as any });

  await page.goto(doc.url);

  await enterJournalPassword(page);

  await browser.close();
}

export default globalSetup;
