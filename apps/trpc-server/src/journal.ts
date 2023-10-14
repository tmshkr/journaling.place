import { Journal } from "@prisma/client";
import { z } from "zod";
import { authorizedProcedure, router } from ".";

export const journalRouter = router({
  getJournals: authorizedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        promptId: z.string().optional(),
        ts: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;
      const { cursor, promptId, ts } = input;
      const take = 100;
      type JournalWithPrompt = Journal & {
        prompt?: {
          id: string;
          text: string;
        } | null;
      };
      let journals: JournalWithPrompt[] = [];

      if (promptId) {
        journals = await prisma.journal.findMany({
          where: {
            authorId: user.id,
            promptId: promptId,
          },
          orderBy: {
            updatedAt: "desc",
          },
        });
      } else {
        journals = await prisma.journal.findMany({
          where: {
            authorId: user.id,
            updatedAt: {
              gt: new Date(ts || 0),
            },
          },
          take,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { updatedAt: "desc" },
          include: {
            prompt: {
              select: {
                id: true,
                text: true,
              },
            },
          },
        });
      }

      return {
        journals,
        ts: Date.now(),
        nextCursor:
          journals.length === take
            ? journals[journals.length - 1].id
            : undefined,
      };
    }),
});
