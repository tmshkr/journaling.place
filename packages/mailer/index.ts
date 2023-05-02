import Email from "email-templates";
const path = require("path");
const nodemailer = require("nodemailer");
const transport = nodemailer.createTransport(process.env.EMAIL_SERVER);

export async function sendWelcomeEmail(emailTo: string, root: string = "") {
  const email = new Email({
    message: {
      from: "Journaling Place <hi@journaling.place>",
    },
    send: true,
    transport,
    preview: {
      openSimulator: false,
    },
    views: { root: path.join(root, "emails") },
    juice: true,
    juiceSettings: {
      tableElements: ["TABLE"],
    },
    juiceResources: {
      applyStyleTags: true,
      webResources: {
        relativeTo: path.join(root, "assets"),
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

export async function sendPromptOfTheDay(
  emailTo: string,
  prompt,
  root: string = ""
) {
  const email = new Email({
    message: {
      from: "Journaling Place <hi@journaling.place>",
    },
    send: true,
    transport,
    preview: {
      openSimulator: false,
    },
    views: { root: path.join(root, "emails") },
    juice: true,
    juiceSettings: {
      tableElements: ["TABLE"],
    },
    juiceResources: {
      applyStyleTags: true,
      webResources: {
        relativeTo: path.join(root, "assets"),
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
        url: process.env.NEXTAUTH_URL,
      },
    })
    .then(({ response, envelope, messageId }) => {
      console.log({ response, envelope, messageId });
    })
    .catch(console.error);
}
