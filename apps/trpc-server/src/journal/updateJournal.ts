import { z } from "zod";
import { authorizedProcedure } from "..";

export const updateJournal = authorizedProcedure
  .input(
    z.object({
      id: z.string(),
      ciphertext: z.object({
        type: z.string().regex(/Buffer/),
        data: z.array(z.number()),
      }),
      iv: z.object({
        type: z.string().regex(/Buffer/),
        data: z.array(z.number()),
      }),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { user, prisma } = ctx;
    const { id, ciphertext, iv } = input;

    await prisma.journal.update({
      where: {
        id_authorId: {
          id,
          authorId: user.id,
        },
      },
      data: {
        ciphertext: Buffer.from(ciphertext as any),
        iv: Buffer.from(iv as any),
      },
    });
  });
