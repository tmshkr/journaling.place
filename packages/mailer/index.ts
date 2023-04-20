import Email from "email-templates";
const nodemailer = require("nodemailer");
// require("dotenv").config({ path: "../../.env" });

export async function sendWelcomEmail(emailTo, root) {
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
