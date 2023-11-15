import { PrismaClient, Journal, User, JournalStatus } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import { ObjectId } from "mongodb";

export const prismaMock = mockDeep<PrismaClient>();

export let db: {
  users: { [id: string]: User };
  journals: { [id_authorId: string]: Journal };
} = {
  users: {},
  journals: {},
};

export function resetDB() {
  db = {
    users: {},
    journals: {},
  };
}

prismaMock.user.create.mockImplementation((args): any => {
  const { data } = args!;
  const user: User = {
    id: new ObjectId().toString(),
    name: null,
    image: null,
    emailVerified: new Date(),
    salt: null,
    email: data!.email || null,
    isSubscribedPOTD: data!.isSubscribedPOTD || true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  db.users[user.id] = user;
  return user;
});

prismaMock.user.findUniqueOrThrow.mockImplementation((args): any => {
  const { where } = args!;
  if (!where?.id) throw new Error("Only ID lookup supported");
  const user = db.users[where.id];
  if (!user) throw new Error("Not found");
  return user;
});

prismaMock.journal.create.mockImplementation((args): any => {
  const { data } = args!;
  const journal: Journal = {
    id: new ObjectId().toString(),
    authorId: data!.authorId!,
    promptId: data!.promptId || null,
    ciphertext: data!.ciphertext || null,
    iv: data!.iv || null,
    status: data!.status || JournalStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const key = `${journal.id}_${journal.authorId}`;
  db.journals[key] = journal;
  return journal;
});

prismaMock.journal.findUniqueOrThrow.mockImplementation((args): any => {
  const { id, authorId } = args!.where!.id_authorId!;
  const journal = db.journals[`${id}_${authorId}`];
  if (!journal) throw new Error("Not found");
  return journal;
});

prismaMock.journal.update.mockImplementation((args): any => {
  const { id, authorId } = args!.where!.id_authorId!;
  const { ciphertext, iv, status } = args.data!;
  const key = `${id}_${authorId}`;
  const journal = db.journals[key];
  if (!journal) throw new Error("Not found");

  const updatedJournal: Journal = {
    id: journal.id,
    authorId: journal.authorId,
    promptId: journal.promptId,
    ciphertext: (ciphertext as Buffer) || journal.ciphertext,
    iv: (iv as Buffer) || journal.iv,
    status: (status as JournalStatus) || journal.status,
    createdAt: journal.createdAt,
    updatedAt: new Date(),
  };
  db.journals[key] = updatedJournal;

  return updatedJournal;
});
