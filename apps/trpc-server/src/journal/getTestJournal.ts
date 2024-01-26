import { authorizedProcedure } from "..";

// Returns a journal to test the encryption key on the client
export const getTestJournal = authorizedProcedure.query(async ({ ctx }) => {
  const { user, prisma } = ctx;

  const [journal] = await prisma.journal.findMany({
    where: {
      OR: [
        {
          authorId: user.id,
          status: "ACTIVE",
        },
        {
          authorId: user.id,
          status: "TRASHED",
        },
      ],
    },
    take: 1,
  });

  return journal;
});
