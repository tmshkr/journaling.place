import { appRouter, prisma } from "..";
import { JournalStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { User } from "@prisma/client";

let testUser: User;
let caller;

beforeAll(async () => {
  testUser = await prisma.user.findUniqueOrThrow({
    where: { email: "test@journaling.place" },
  });
  caller = appRouter.createCaller({
    token: { sub: testUser.id, user: { salt: { data: testUser.salt } } },
    prisma,
  });
});

describe("updateJournalStatus", () => {
  it("should not allow the journal to be deleted when it is ACTIVE", async () => {
    const testJournal = await prisma.journal.create({
      data: { authorId: testUser.id, status: JournalStatus.ACTIVE },
    });

    try {
      await caller.journal.updateJournalStatus({
        id: testJournal.id,
        status: JournalStatus.DELETED,
      });
    } catch (err: unknown) {
      expect((err as TRPCError).code).toBe("BAD_REQUEST");
      expect((err as TRPCError).message).toBe("Cannot delete active journal");
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
