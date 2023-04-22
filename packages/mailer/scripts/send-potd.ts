import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { sendPromptOfTheDay } from "..";

async function run() {
  const users = await prisma.user.findMany({
    where: {
      isSubscribedPOTD: true,
    },
  });
  for (const user of users) {
    if (!user.email) continue;
    await sendPromptOfTheDay(user.email);
  }
}

run();
