import { prisma } from "src/lib/prisma";
import { encode } from "next-auth/jwt";
import { createMocks } from "node-mocks-http";
import router from "./trash";

let jwt;
let journal;

beforeAll(async () => {
  const testUser = { id: 0 };
  await prisma.user.upsert({
    where: testUser,
    create: testUser,
    update: testUser,
  });
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

describe("PATCH /api/journal/[id]/trash", () => {
  test("returns 200 with correct parameters", async () => {
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
  });
});
