import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seed() {
  const { default: prompts } = await import("../data/prompts.json", {
    with: { type: "json" },
  });

  const dbPrompts = await prisma.prompt.findMany().then((prompts) => {
    return prompts.reduce((acc, cur) => {
      acc[cur.text] = cur;
      return acc;
    }, {});
  });

  let newPrompts = 0;
  let updatedPrompts = 0;

  for (const { prompt, tags, stub } of prompts) {
    const dbPrompt = dbPrompts[prompt];
    if (!dbPrompt) {
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
        });
    } else if (
      (stub && dbPrompt.stub !== stub) ||
      (tags && !tags.every((tag) => dbPrompt.tags.includes(tag)))
    ) {
      await prisma.prompt
        .update({
          where: { id: dbPrompt.id },
          data: { stub, tags },
        })
        .then(() => {
          console.log(`Updated prompt: ${prompt}`);
          updatedPrompts++;
        });
    }
  }

  console.log(`Created ${newPrompts} new prompts`);
  console.log(`Updated ${updatedPrompts} prompts`);
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
