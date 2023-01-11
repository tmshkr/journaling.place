import { PrismaClient } from "@prisma/client";
import prompts from "../data/prompts.json";
const prisma = new PrismaClient();

//TODO: put new prompts at beginning of array and stop when you hit a duplicate
async function seed() {
  const { count } = await prisma.tag.createMany({
    data: prompts.flatMap(({ tags }) => tags).map((tag) => ({ text: tag })),
    skipDuplicates: true,
  });

  console.log(`Created ${count} new tags`);

  let newPrompts = 0;
  for (const prompt of prompts) {
    const didCreate = await createPrompt(prompt);
    if (didCreate) newPrompts++;
  }

  console.log(`Created ${newPrompts} new prompts`);
}

async function createPrompt({ prompt, tags }) {
  try {
    var { id: promptId } = await prisma.prompt.create({
      data: {
        text: prompt,
      },
    });

    for (const tag of tags) {
      const { id: tagId } = await prisma.tag.findUniqueOrThrow({
        where: { text: tag },
      });
      await prisma.tagOnPrompt.create({
        data: {
          promptId,
          tagId,
        },
      });
    }
    return true;
  } catch (err: any) {
    if (err.code === "P2002" && err.meta.target.includes("text")) {
      return false;
    } else {
      console.log("Failed to create: ", prompt);
      throw err;
    }
  }
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
