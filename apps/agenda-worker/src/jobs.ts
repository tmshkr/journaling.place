import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { sendPromptOfTheDay } from "mailer";

const path = require("path");
const root = path.resolve(process.cwd(), "../../packages/mailer");

export function registerJobs(agenda) {
  agenda.define("sendEmailPOTD", async () => {
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
      await sendPromptOfTheDay(user.email, randomPrompt, root);
    }
  });

  console.log("Agenda jobs registered");
}

export async function scheduleJobs(agenda) {
  await agenda.every(
    "0 5 * * *",
    "sendEmailPOTD",
    {},
    { timezone: "America/Los_Angeles" }
  );
  console.log("Agenda jobs scheduled");
}
