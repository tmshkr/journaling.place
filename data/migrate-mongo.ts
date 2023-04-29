import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const users = require("./dump/users.json");
const journals = require("./dump/journals.json");
const oldPrompts = require("./dump/prompts.json");

async function run() {
  const oldUserIdToNewUserId = {};
  const oldPromptIdToNewPromptId = {};

  const newPrompts = await prisma.prompt.findMany();

  for (const { id, text } of oldPrompts) {
    const newPrompt = newPrompts.find((p) => p.text === text);
    if (!newPrompt) throw new Error(`Prompt not found: ${text}`);
    oldPromptIdToNewPromptId[id] = newPrompt.id;
  }

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
        emailVerified,
        email,
        isSubscribedPOTD,
        salt: salt ? Buffer.from(salt) : undefined,
        createdAt,
        updatedAt,
      },
    });
    oldUserIdToNewUserId[id] = newUser.id;
  }

  for (const {
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
        authorId: oldUserIdToNewUserId[authorId] || new Error("User not found"),
        promptId: oldPromptIdToNewPromptId[promptId],
        ciphertext: ciphertext ? Buffer.from(ciphertext) : undefined,
        iv: iv ? Buffer.from(iv) : undefined,
        status,
        createdAt,
        updatedAt,
      },
    });
  }
}

run()
  .then(async () => {
    console.log("Done!");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
