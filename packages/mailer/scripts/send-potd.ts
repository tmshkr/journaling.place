import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { sendPromptOfTheDay } from "..";

async function run() {
  const count = await prisma.prompt.count();
  const [randomPrompt] = await prisma.prompt.findMany({
    take: 1,
    select: { id: true, text: true },
    skip: Math.floor(Math.random() * count),
  });
  const users = await prisma.user.findMany({
    where: {
      isSubscribedPOTD: true,
    },
  });
  for (const user of users) {
    if (!user.email) continue;
    await sendPromptOfTheDay(user.email, randomPrompt);
  }
}

run();
