import Email from "email-templates";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");
const path = require("path");
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
    juice: true,
    juiceSettings: {
      tableElements: ["TABLE"],
    },
    juiceResources: {
      applyStyleTags: true,
      webResources: {
        //
        // this is the relative directory to your CSS/image assets
        // and its default path is `build/`:
        //
        // e.g. if you have the following in the `<head`> of your template:
        // `<link rel="stylesheet" href="style.css" data-inline="data-inline">`
        // then this assumes that the file `build/style.css` exists
        //
        relativeTo: path.resolve("styles"),
        //
        // but you might want to change it to something like:
        // relativeTo: path.join(__dirname, '..', 'assets')
        // (so that you can re-use CSS/images that are used in your web-app)
        //
      },
    },
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
