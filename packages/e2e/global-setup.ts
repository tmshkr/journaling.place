import { FullConfig } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import { mockStorageState } from "./utils/mockStorageState";
import { writeFileSync } from "fs";

const baseURL = new URL(process.env.BASE_URL || process.env.NEXTAUTH_URL);
const { ENVIRONMENT } = process.env;
const fetchVersion = async (url, maxAttempts = 100) => {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      const res = await fetch(url).then((res) => res.json());
      return res;
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

async function checkVersion() {
  const { version } = await fetchVersion(`${baseURL}api/info`);
  if (version !== process.env.APP_VERSION) {
    throw new Error(
      `Version mismatch: ${version} (server) !== ${process.env.APP_VERSION} (client)`
    );
  }
}

async function getSSMParameters() {
  console.log("Getting SSM parameters");
  const client = new SSMClient({ region: "us-west-2" });
  const { Parameters } = await client.send(
    new GetParametersCommand({
      Names: [
        `/journaling.place/${ENVIRONMENT}/MONGO_URI`,
        `/journaling.place/${ENVIRONMENT}/NEXTAUTH_SECRET`,
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
  await checkVersion();

  if (["main", "staging"].includes(ENVIRONMENT)) {
    await getSSMParameters();
  }
  const prisma = new PrismaClient();
  const user = await prisma.user
    .findUniqueOrThrow({
      where: { email: "test@journaling.place" },
    })
    .catch(async (e) => {
      if (e.code === "P2025") {
        return await prisma.user.create({
          data: {
            email: "test@journaling.place",
          },
        });
      } else throw e;
    });
  await prisma.$disconnect();

  const state = await mockStorageState(user, baseURL);
  writeFileSync("storageState.json", state);
}

export default globalSetup;
