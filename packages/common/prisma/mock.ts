import { PrismaClient, Journal, User, JournalStatus } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import { ObjectId } from "mongodb";

export const prismaMock = mockDeep<PrismaClient>();

const userDB: { [id: string]: User } = {};
const journalDB: { [id_authorId: string]: Journal } = {};

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
  userDB[user.id] = user;
  return user;
});

prismaMock.user.findUniqueOrThrow.mockImplementation((args): any => {
  const { where } = args!;
  if (!where?.id) throw new Error("Only ID lookup supported");
  const user = userDB[where.id];
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
  journalDB[key] = journal;
  return journal;
});

prismaMock.journal.findUniqueOrThrow.mockImplementation((args): any => {
  const { id, authorId } = args!.where!.id_authorId!;
  const journal = journalDB[`${id}_${authorId}`];
  if (!journal) throw new Error("Not found");
  return journal;
});

prismaMock.journal.update.mockImplementation((args): any => {
  const { id, authorId } = args!.where!.id_authorId!;
  const { ciphertext, iv, status } = args.data!;
  const key = `${id}_${authorId}`;
  const journal = journalDB[key];
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
  journalDB[key] = updatedJournal;

  return updatedJournal;
});
