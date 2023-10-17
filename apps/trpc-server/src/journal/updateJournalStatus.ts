import { z } from "zod";
import { authorizedProcedure } from "..";
import { JournalStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const updateJournalStatus = authorizedProcedure
  .input(
    z.object({
      id: z.string(),
      status: z.enum([
        JournalStatus.ACTIVE,
        JournalStatus.DELETED,
        JournalStatus.TRASHED,
      ]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { user, prisma } = ctx;
    const { id, status } = input;

    const journal = await prisma.journal.findUniqueOrThrow({
      where: {
        id_authorId: {
          id,
          authorId: user.id,
        },
      },
    });

    if (journal.status === JournalStatus.DELETED) {
      throw new TRPCError({
        message: "Cannot update deleted journal",
        code: "BAD_REQUEST",
      });
    }

    if (
      journal.status === JournalStatus.ACTIVE &&
      status === JournalStatus.DELETED
    ) {
      throw new TRPCError({
        message: "Cannot delete active journal",
        code: "BAD_REQUEST",
      });
    }

    await prisma.journal.update({
      where: {
        id_authorId: {
          id,
          authorId: user.id,
        },
      },
      data:
        status === JournalStatus.DELETED
          ? { status, ciphertext: null, iv: null, promptId: null }
          : { status },
    });
  });
