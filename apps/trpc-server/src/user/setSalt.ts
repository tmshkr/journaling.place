import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authorizedProcedure } from "..";

export const setSalt = authorizedProcedure
  .input(
    z.object({
      salt: z.object({
        type: z.string().regex(/Buffer/),
        data: z.array(z.number()),
      }),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { user, prisma } = ctx;
    const { salt } = input;

    if (user.salt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User already has salt.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { salt: Buffer.from(salt.data) },
    });

    return "OK";
  });
