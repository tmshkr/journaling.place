import { FullConfig } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { SSMClient, GetParametersCommand } from "@aws-sdk/client-ssm";
import { mockStorageState } from "./utils/mockStorageState";
import { writeFileSync } from "fs";

const baseURL = new URL(process.env.BASE_URL || process.env.NEXTAUTH_URL);
const { ENVIRONMENT } = process.env;

async function checkVersion() {
  const { version } = JSON.parse(
    execSync(
      `curl -sSk --retry-all-errors --retry 10 ${baseURL}api/info`
    ).toString()
  );
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
