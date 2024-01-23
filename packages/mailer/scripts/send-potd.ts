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

  const potdTopic = await prisma.topic.findUniqueOrThrow({
    where: { name: "Prompt of the Day" },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: {
      topicId: potdTopic.id,
      subscribed: true,
    },
    include: { user: true },
  });

  for (const { user } of subscriptions) {
    if (!user.email) continue;
    await sendPromptOfTheDay(user.email, randomPrompt);
  }
}

run();
