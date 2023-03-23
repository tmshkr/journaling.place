import { prisma } from "src/lib/prisma";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function PromptPage({ prompt }) {
  return <JournalPrompt prompt={prompt} />;
}

export async function getServerSideProps(context) {
  const count = await prisma.prompt.count();
  const [randomPrompt] = await prisma.prompt.findMany({
    take: 1,
    select: { id: true, text: true },
    skip: Math.floor(Math.random() * count),
  });

  return {
    props: {
      prompt: randomPrompt,
    },
  };
}
