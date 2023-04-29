import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const users = require("./dump/users.json");
const journals = require("./dump/journals.json");

async function run() {
  const oldUserIdToNewUserId = {};
  const oldPromptIdToNewPromptId = {};

  const prompts = await prisma.prompt.findMany();

  // for (const { id, text } of prompts) {
  //   oldPromptIdToNewPromptId[id] = newPrompt.id;
  // }

  for (const {
    id,
    emailVerified,
    email,
    isSubscribedPOTD,
    salt,
    createdAt,
    updatedAt,
  } of users) {
    const newUser = await prisma.user.create({
      data: {
        id,
        emailVerified,
        email,
        isSubscribedPOTD,
        salt,
        createdAt,
        updatedAt,
      },
    });
    oldUserIdToNewUserId[id] = newUser.id;
  }

  for (const {
    id,
    authorId,
    promptId,
    ciphertext,
    iv,
    status,
    createdAt,
    updatedAt,
  } of journals) {
    await prisma.journal.create({
      data: {
        id,
        authorId: oldUserIdToNewUserId[authorId],
        promptId,
        ciphertext,
        iv,
        status,
        createdAt,
        updatedAt,
      },
    });
  }
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
