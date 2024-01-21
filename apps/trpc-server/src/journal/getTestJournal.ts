import { authorizedProcedure } from "..";

// Returns an active journal to test the encryption key on the client
export const getTestJournal = authorizedProcedure.query(async ({ ctx }) => {
  const { user, prisma } = ctx;

  const [journal] = await prisma.journal.findMany({
    where: {
      authorId: user.id,
      status: "ACTIVE",
    },
    take: 1,
  });

  return journal;
});
