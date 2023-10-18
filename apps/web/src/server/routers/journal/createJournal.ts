import { z } from "zod";
import { authorizedProcedure } from "src/server/trpc";

export const createJournal = authorizedProcedure
  .input(
    z.object({
      ciphertext: z.object({
        type: z.string().regex(/Buffer/),
        data: z.array(z.number()),
      }),
      iv: z.object({
        type: z.string().regex(/Buffer/),
        data: z.array(z.number()),
      }),
      promptId: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { user, prisma } = ctx;
    const { ciphertext, iv, promptId } = input;

    const { id } = await prisma.journal.create({
      data: {
        promptId: promptId ? promptId : undefined,
        authorId: user.id,
        ciphertext: Buffer.from(ciphertext as any),
        iv: Buffer.from(iv as any),
      },
    });
    return { id };
  });
