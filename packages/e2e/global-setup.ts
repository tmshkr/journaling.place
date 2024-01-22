import { chromium, FullConfig } from "@playwright/test";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import { mongoClient } from "common/mongo/client";
import { enterJournalPassword } from "./utils/enterJournalPassword";

const { ENVIRONMENT, TEST_USER_EMAIL } = process.env;
const baseURL = new URL(process.env.BASE_URL || process.env.NEXTAUTH_URL);

async function checkVersion(baseURL) {
  const fetchVersion = async (url, maxAttempts = 10) => {
    let attempts = 0;
    while (true) {
      try {
        attempts++;
        const { version } = await fetch(url).then((res) => res.json());
        return version;
      } catch (err) {
        console.error(err.message);
        for (const key in err) {
          console.error(key, err[key]);
        }
        if (attempts >= maxAttempts) throw err;
        console.log(`Attempt ${attempts}: Retrying in 5 seconds...`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  };

  const version = await fetchVersion(`${baseURL}api/info`);
  if (version !== process.env.APP_VERSION) {
    throw new Error(
      `Version mismatch: ${version} (server) !== ${process.env.APP_VERSION} (client)`
    );
  }
}

async function getSSMParameters() {
  console.log("Getting SSM parameters");
  const client = new SSMClient();
  const { Parameters } = await client.send(
    new GetParametersCommand({
      Names: [
        `/journaling.place/${ENVIRONMENT}/MONGO_URI`,
        `/journaling.place/${ENVIRONMENT}/TEST_USER_EMAIL`,
      ],
      WithDecryption: true,
    })
  );
  for (const { Name, Value } of Parameters) {
    process.env[Name.split("/").pop()] = Value;
    console.log(`::add-mask::${Value}`);
  }
}

async function globalSetup(config: FullConfig) {
  if (["main", "staging"].includes(ENVIRONMENT)) {
    await getSSMParameters();
  }

  await checkVersion(baseURL);

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

  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
  await browser.close();
}

export default globalSetup;
