import { useEffect } from "react";
import { prisma } from "src/lib/prisma";
import { currentPrompt } from "src/store/prompt";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function PromptPage({ prompt }) {
  useEffect(() => {
    currentPrompt.value = prompt;
    return () => {
      currentPrompt.value = null;
    };
  }, [prompt]);
  return <JournalPrompt prompt={prompt} isNewEntry={true} />;
}

export async function getServerSideProps(context) {
  const promptId = context.query.promptId;
  if (!promptId) {
    return {
      props: {
        prompt: null,
      },
    };
  }

  let prompt;

  if (promptId === "random") {
    const count = await prisma.prompt.count();
    [prompt] = await prisma.prompt.findMany({
      take: 1,
      select: { id: true, text: true },
      skip: Math.floor(Math.random() * count),
    });
    return {
      props: {
        prompt,
      },
    };
  }

  prompt = await prisma.prompt.findUnique({
    where: { id: Number(promptId) },
    select: { id: true, text: true },
  });

  return {
    props: {
      prompt,
    },
  };
}
