import { JournalStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { User } from "@prisma/client";
import { appRouter } from "../router";
import { prismaMock } from "common/prisma/mock";

let testUser: User;
let caller;

beforeAll(async () => {
  testUser = await prismaMock.user.create({
    data: { email: "test@journaling.place" },
  });

  caller = appRouter.createCaller({
    token: {
      sub: testUser.id,
      user: { salt: { data: testUser.salt || null } },
    },
    prisma: prismaMock,
  });
});

describe("updateJournalStatus", () => {
  it("should not allow a journal to be updated when it is DELETED", async () => {
    const testJournal = await prismaMock.journal.create({
      data: { authorId: testUser.id, status: JournalStatus.DELETED },
    });

    try {
      await caller.journal.updateJournalStatus({
        id: testJournal.id,
        status: JournalStatus.ACTIVE,
      });
    } catch (err: unknown) {
      expect((err as TRPCError).code).toBe("BAD_REQUEST");
      expect((err as TRPCError).message).toBe("Cannot update deleted journal");
    }
  });

  it("should not allow a journal to be deleted when it is ACTIVE", async () => {
    const testJournal = await prismaMock.journal.create({
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

  it("should be able to move an ACTIVE journal into TRASHED status", async () => {
    const testJournal = await prismaMock.journal.create({
      data: { authorId: testUser.id, status: JournalStatus.ACTIVE },
    });

    const updatedJournal = await caller.journal.updateJournalStatus({
      id: testJournal.id,
      status: JournalStatus.TRASHED,
    });
    expect(updatedJournal.id).toBe(testJournal.id);
    expect(updatedJournal.status).toBe(JournalStatus.TRASHED);
  });

  it("should be able to move a TRASHED journal into DELETED status", async () => {
    const testJournal = await prismaMock.journal.create({
      data: { authorId: testUser.id, status: JournalStatus.TRASHED },
    });

    const updatedJournal = await caller.journal.updateJournalStatus({
      id: testJournal.id,
      status: JournalStatus.DELETED,
    });
    expect(updatedJournal.id).toBe(testJournal.id);
    expect(updatedJournal.status).toBe(JournalStatus.DELETED);
  });
});
