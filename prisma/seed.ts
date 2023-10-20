import { PrismaClient } from "@prisma/client";
const prompts = require("../data/prompts.json");
const prisma = new PrismaClient();

async function seed() {
  let newPrompts = 0;

  for (const { prompt, tags, stub } of prompts) {
    await prisma.prompt
      .create({
        data: {
          text: prompt,
          tags,
          stub,
        },
      })
      .then(() => {
        console.log(`Created prompt: ${prompt}`);
        newPrompts++;
      })
      .catch((err) => {
        if (err.code === "P2002") {
          console.log(`Prompt already exists: ${prompt}`);
        } else throw err;
      });
  }

  console.log(`Created ${newPrompts} new prompts`);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
