import { useEffect } from "react";
import { prisma } from "src/lib/prisma";
import { useAppSelector, useAppDispatch } from "src/store";
import { setPrompt, selectPrompt } from "src/store/prompt";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function PromptPage({ prompt }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(
      setPrompt(prompt ? { ...prompt, id: prompt.id.toString() } : null)
    );
  }, [prompt?.id]);
  return <JournalPrompt isNewEntry={true} journalId={undefined} />;
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
