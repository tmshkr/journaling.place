import { FullConfig } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import { mockStorageState } from "./utils/mockStorageState";
import { writeFileSync } from "fs";

const { ENVIRONMENT } = process.env;

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
        `/journaling.place/NGROK_URL`,
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

  const baseURL = new URL(
    process.env.NGROK_URL || process.env.BASE_URL || process.env.NEXTAUTH_URL
  );

  await checkVersion(baseURL);

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
