import { useEffect } from "react";
import { prisma } from "src/lib/prisma";
import { useAppSelector, useAppDispatch } from "src/store";
import { setPrompt, selectPrompt } from "src/store/prompt";
import { JournalView } from "src/components/JournalView";

export default function PromptPage({ prompt }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setPrompt({ ...prompt, id: prompt.id.toString() }));
  }, [prompt.id]);

  return <JournalView />;
}

export async function getServerSideProps(context) {
  const { slug } = context.query;

  if (Number(slug)) {
    const prompt = await prisma.prompt.findUnique({
      where: { id: Number(slug) },
      select: { id: true, text: true },
    });
    if (prompt) {
      return {
        props: {
          prompt,
        },
      };
    }
  }

  const count = await prisma.prompt.count();
  const [randomPrompt] = await prisma.prompt.findMany({
    take: 1,
    select: { id: true, text: true },
    skip: Math.floor(Math.random() * count),
  });

  return {
    redirect: {
      destination: `/${randomPrompt.id}`,
      permanent: false,
    },
  };
}
