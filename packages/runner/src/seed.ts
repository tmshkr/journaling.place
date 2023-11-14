import { prisma } from "./index";

export async function seed(prompts) {
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
