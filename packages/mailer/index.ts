import Email from "email-templates";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");
require("dotenv").config({ path: "../../.env" });

export async function sendWelcomeEmail(emailTo: string, root: string) {
  const email = new Email({
    message: {
      from: "hi@journaling.place",
    },
    send: true,
    transport: nodemailer.createTransport(process.env.EMAIL_SERVER),
    preview: {
      openSimulator: false,
    },
    views: { root },
  });

  email
    .send({
      template: "welcome",
      message: {
        to: emailTo,
      },
    })
    .then((data) => {
      console.log(data);
    })
    .catch(console.error);
}

export async function sendPromptOfTheDay(emailTo: string, root?: string) {
  const count = await prisma.prompt.count();
  const [randomPrompt] = await prisma.prompt.findMany({
    take: 1,
    select: { id: true, text: true },
    skip: Math.floor(Math.random() * count),
  });

  const email = new Email({
    message: {
      from: "hi@journaling.place",
    },
    send: false,
    transport: nodemailer.createTransport(process.env.EMAIL_SERVER),
    preview: {
      openSimulator: false,
    },
    views: { root },
  });

  email
    .send({
      template: "potd",
      message: {
        to: emailTo,
      },
      locals: {
        prompt: randomPrompt,
        url: process.env.NEXTAUTH_URL,
      },
    })
    .then((data) => {
      console.log(data);
    })
    .catch(console.error);
}

sendPromptOfTheDay(process.env.TEST_EMAIL_TO as string);
