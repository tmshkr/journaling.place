import { prisma } from "src/lib/prisma";
import { getToken } from "next-auth/jwt";
import { useEffect } from "react";
import { currentPrompt } from "src/store/prompt";
import { JournalView } from "src/components/JournalView";
import superjson from "superjson";

superjson.registerCustom<Buffer, number[]>(
  {
    isApplicable: (v): v is Buffer => v instanceof Buffer,
    serialize: (v) => Array.from(v),
    deserialize: (v) => Buffer.from(v),
  },
  "buffer"
);

export default function JournalPage({ journal }) {
  useEffect(() => {
    currentPrompt.value = journal.prompt;
    return () => {
      currentPrompt.value = null;
    };
  }, [journal.prompt]);

  return <JournalView prompt={journal.prompt} journal={journal} />;
}

export async function getServerSideProps({ params, req, res }) {
  const nextToken: any = await getToken({ req });
  if (!nextToken) {
    return {
      notFound: true,
    };
  }

  const journal = await prisma.journal.findUnique({
    where: {
      id_authorId: {
        id: BigInt(params.id),
        authorId: BigInt(nextToken.sub),
      },
    },
    include: {
      prompt: {
        select: {
          id: true,
          text: true,
          journals: {
            select: {
              id: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!journal) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      journal: journal,
    },
  };
}
