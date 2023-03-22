import { prisma } from "src/lib/prisma";
import { useAppDispatch, useAppSelector } from "src/store";
import { setPrompt, selectPrompt } from "src/store/prompt";
import { JournalPrompt } from "src/components/JournalPrompt";

export default function PromptPage({ prompt }) {
  const dispatch = useAppDispatch();
  dispatch(setPrompt(prompt));
  return <JournalPrompt />;
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
          prompt: {
            ...prompt,
            id: prompt.id.toString(),
          },
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
