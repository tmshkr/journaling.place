import { FullConfig } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { mockStorageState } from "./utils/mockStorageState";
import { writeFileSync } from "fs";
const prisma = new PrismaClient();

const baseURL = new URL(process.env.BASE_URL || process.env.NEXTAUTH_URL);
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
  if (version !== process.env.NEXT_PUBLIC_VERSION) {
    throw new Error(
      `Version mismatch: ${version} (server) !== ${process.env.NEXT_PUBLIC_VERSION} (client)`
    );
  }
}

async function globalSetup(config: FullConfig) {
  await checkVersion();

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

  const state = await mockStorageState(user, baseURL);
  writeFileSync("storageState.json", state);
}

export default globalSetup;
