import { PrismaClient, NotificationTopic } from "@prisma/client";
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

    const users = await prisma.user.findMany({
      where: {
        emailNotifications: {
          has: NotificationTopic.prompt_of_the_day,
        },
      },
    });

    for (const user of users) {
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
