import { useEffect } from "react";
import { prisma } from "src/lib/prisma";
import { useAppSelector, useAppDispatch } from "src/store";
import { setPrompt, selectPrompt } from "src/store/prompt";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function PromptPage({ prompt }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setPrompt({ ...prompt, id: prompt.id.toString() }));
  }, [prompt.id]);
  return (
    <JournalPrompt prompt={prompt} isNewEntry={false} journalId={undefined} />
  );
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
