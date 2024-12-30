import Email from "email-templates";
import { encode } from "next-auth/jwt";
import { resolve } from "path";
import { createTransport } from "nodemailer";
const transport = createTransport(process.env.EMAIL_SERVER);

const rootDir = process.env.ROOT_DIR!;
if (!rootDir) throw new Error("ROOT_DIR env var not set");
const emailDir = resolve(rootDir, "packages", "mailer", "emails");
const assetsDir = resolve(rootDir, "packages", "mailer", "assets");

export async function sendWelcomeEmail(emailTo: string) {
  const email = new Email({
    message: {
      from: "Journaling Place <hi@journaling.place>",
    },
    send: true,
    transport,
    preview: {
      openSimulator: false,
    },
    views: { root: emailDir },
    juice: true,
    juiceSettings: {
      tableElements: ["TABLE"],
    },
    juiceResources: {
      applyStyleTags: true,
      webResources: {
        relativeTo: assetsDir,
      },
    },
  });

  email
    .send({
      template: "welcome",
      message: {
        to: emailTo,
      },
    })
    .then(({ response, envelope, messageId }) => {
      console.log({ response, envelope, messageId });
    })
    .catch(console.error);
}

export async function sendPromptOfTheDay(emailTo: string, prompt) {
  const token = await encode({
    token: { email: emailTo },
    secret: process.env.EMAIL_SECRET!,
  });

  const email = new Email({
    message: {
      from: "Journaling Place <hi@journaling.place>",
      headers: {
        "List-Unsubscribe": `<${process.env.NEXTAUTH_URL}/api/email/unsubscribe?topic=prompt_of_the_day&token=${token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    },
    send: true,
    transport,
    preview: {
      openSimulator: false,
    },
    views: { root: emailDir },
    juice: true,
    juiceSettings: {
      tableElements: ["TABLE"],
    },
    juiceResources: {
      applyStyleTags: true,
      webResources: {
        relativeTo: assetsDir,
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
        prompt,
        token,
        url: process.env.NEXTAUTH_URL,
      },
    })
    .then(({ response, envelope, messageId }) => {
      console.log({ response, envelope, messageId });
    })
    .catch(console.error);
}
