import { prisma } from "src/lib/prisma";
import { encode } from "next-auth/jwt";
import { createMocks } from "node-mocks-http";
import router from "./trash";

let jwt;
let journal;

beforeAll(async () => {
  jwt = await encode({
    token: { sub: "0", user: { id: 0, salt: { data: [] } } },
    secret: process.env.NEXTAUTH_SECRET as string,
    maxAge: 3600,
  });
  journal = await prisma.journal.create({
    data: {
      authorId: 0,
    },
  });
});

describe("/api/journal/[id]/trash", () => {
  test("marks journal TRASHED", async () => {
    const { req, res } = createMocks({
      method: "PATCH",
      body: {
        status: "TRASHED",
      },
      query: {
        id: journal.id,
      },
      cookies: {
        "next-auth.session-token": jwt,
      },
    });

    await router(req, res);
    expect(res._getStatusCode()).toBe(200);

    const updatedJournal = await prisma.journal.findUniqueOrThrow({
      where: {
        id_authorId: {
          id: BigInt(journal.id),
          authorId: BigInt(journal.authorId),
        },
      },
    });
    expect(updatedJournal.status).toBe("TRASHED");
  });

  test("marks journal ACTIVE", async () => {
    const { req, res } = createMocks({
      method: "PATCH",
      body: {
        status: "ACTIVE",
      },
      query: {
        id: journal.id,
      },
      cookies: {
        "next-auth.session-token": jwt,
      },
    });

    await router(req, res);
    expect(res._getStatusCode()).toBe(200);

    const updatedJournal = await prisma.journal.findUniqueOrThrow({
      where: {
        id_authorId: {
          id: BigInt(journal.id),
          authorId: BigInt(journal.authorId),
        },
      },
    });
    expect(updatedJournal.status).toBe("ACTIVE");
  });

  test("PATCH method does not allow DELETED status", async () => {
    const { req, res } = createMocks({
      method: "PATCH",
      body: {
        status: "DELETED",
      },
      query: {
        id: journal.id,
      },
      cookies: {
        "next-auth.session-token": jwt,
      },
    });

    await router(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  test("ACTIVE record cannot be marked DELETED", async () => {
    await prisma.journal.update({
      where: {
        id_authorId: {
          id: BigInt(journal.id),
          authorId: BigInt(journal.authorId),
        },
      },
      data: {
        status: "ACTIVE",
      },
    });

    const { req, res } = createMocks({
      method: "DELETE",
      query: {
        id: journal.id,
      },
      cookies: {
        "next-auth.session-token": jwt,
      },
    });

    await router(req, res);
    expect(res._getStatusCode()).toBe(403);

    const oldJournal = await prisma.journal.findUniqueOrThrow({
      where: {
        id_authorId: {
          id: BigInt(journal.id),
          authorId: BigInt(journal.authorId),
        },
      },
    });
    expect(oldJournal.status).toBe("ACTIVE");
  });

  test("DELETE method marks journal as DELETED", async () => {
    await prisma.journal.update({
      where: {
        id_authorId: {
          id: BigInt(journal.id),
          authorId: BigInt(journal.authorId),
        },
      },
      data: {
        status: "TRASHED",
      },
    });

    const { req, res } = createMocks({
      method: "DELETE",
      query: {
        id: journal.id,
      },
      cookies: {
        "next-auth.session-token": jwt,
      },
    });

    await router(req, res);
    expect(res._getStatusCode()).toBe(200);

    const updatedJournal = await prisma.journal.findUniqueOrThrow({
      where: {
        id_authorId: {
          id: BigInt(journal.id),
          authorId: BigInt(journal.authorId),
        },
      },
    });
    expect(updatedJournal.status).toBe("DELETED");
  });

  test("DELETED record cannot be updated", async () => {
    const deletedJournal = await prisma.journal.create({
      data: {
        authorId: 0,
        status: "DELETED",
      },
    });
    const { req, res } = createMocks({
      method: "PATCH",
      body: {
        status: "ACTIVE",
      },
      query: {
        id: deletedJournal.id,
      },
      cookies: {
        "next-auth.session-token": jwt,
      },
    });
    await router(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  test("returns 404 with with incorrect method", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        status: "TRASHED",
      },
      query: {
        id: journal.id,
      },
      cookies: {
        "next-auth.session-token": jwt,
      },
    });

    await router(req, res);
    expect(res._getStatusCode()).toBe(404);
  });
});
