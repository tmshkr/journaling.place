import Email from "email-templates";

const email = new Email({
  message: {
    from: "hi@journaling.place",
  },
  // uncomment below to send emails in development/test env:
  // send: true
  transport: {
    jsonTransport: true,
  },
});

email
  .send({
    template: "welcome",
    message: {
      to: process.env.TEST_EMAIL_TO,
    },
  })
  .then(console.log)
  .catch(console.error);
