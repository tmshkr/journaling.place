import { z } from "zod";
import { authorizedProcedure, router } from ".";

export const journalRouter = router({
  getJournals: authorizedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        promptId: z.string().optional(),
        ts: z.date().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const { user } = ctx;
      console.log({ user });
      console.log({ input });
      return `Hello, world!`;
    }),
});
