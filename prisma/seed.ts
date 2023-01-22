import { PrismaClient } from "@prisma/client";
const prompts = require("../data/prompts.json");
const prisma = new PrismaClient();

//Note: put new prompts at beginning of the JSON array
async function seed() {
  // console.log(`Created ${count} new tags`);

  let newPrompts = 0;
  let newTags = 0;

  for (const prompt of prompts) {
    const count = await createPrompt(prompt);
    if (count.newPrompt === 0) break;

    newPrompts += count.newPrompt;
    newTags += count.newTags;
  }

  console.log(`Created ${newPrompts} new prompts`);
  console.log(`Created ${newTags} new tags`);
}

async function createPrompt({ prompt, tags }) {
  const count = { newTags: 0, newPrompt: 0 };
  return prisma.$transaction(async (tx) => {
    const { id: promptId } = await tx.prompt
      .create({
        data: {
          text: prompt,
        },
      })
      .catch((err) => {
        if (err.code === "P2002") {
          console.log("prompt already exists: ", prompt);
          return { id: null };
        }
        console.error(err);
        throw err;
      });

    if (promptId === null) return count;
    count.newPrompt++;

    for (const tag of tags) {
      const { id: tagId } = await tx.tag
        .findUniqueOrThrow({
          where: { text: tag },
        })
        .catch(async (err) => {
          if (err.code === "P2025") {
            console.log("creating new tag: ", tag);
            const newTag = await tx.tag.create({
              data: {
                text: tag,
              },
            });
            count.newTags++;
            return newTag;
          }
          console.error(err);
          throw err;
        });
      await tx.tagOnPrompt.create({
        data: {
          promptId,
          tagId,
        },
      });
    }

    return count;
  });
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
