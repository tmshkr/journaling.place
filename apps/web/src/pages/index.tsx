import { useEffect } from "react";
import { prisma } from "src/lib/prisma";
import { currentPrompt } from "src/store/prompt";
import { JournalView } from "src/components/JournalView";

export default function PromptPage({ prompt }) {
  useEffect(() => {
    currentPrompt.value = prompt;
    return () => {
      currentPrompt.value = null;
    };
  }, [prompt]);

  return <JournalView prompt={prompt} journal={null} />;
}

export async function getServerSideProps({ req, res }) {
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
