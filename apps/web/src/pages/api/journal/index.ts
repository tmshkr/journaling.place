import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";

(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).get(handleGet).post(handlePost);

async function handleGet(req, res) {
  const { cursor, promptId, ts } = req.query;
  const take = 100;

  if (promptId) {
    return res.json(
      await prisma.journal.findMany({
        where: {
          authorId: BigInt(req.user.id),
          promptId: BigInt(promptId),
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    );
  }

  return res.json(
    await prisma.journal
      .findMany({
        where: {
          authorId: BigInt(req.user.id),
          updatedAt: {
            gt: ts ? new Date(ts) : undefined,
          },
        },
        take,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: BigInt(cursor) } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          prompt: {
            select: {
              id: true,
              text: true,
            },
          },
        },
      })
      .then((journals) => {
        return {
          journals,
          ts: new Date().toISOString(),
          nextCursor:
            journals.length === take
              ? journals[journals.length - 1].id
              : undefined,
        };
      })
  );
}

async function handlePost(req, res) {
  try {
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
    }).parse(req.body);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errorMessage: "Bad Request" });
  }

  const { ciphertext, iv, promptId } = req.body;
  const { id } = await prisma.journal.create({
    data: {
      promptId: promptId ? BigInt(promptId) : undefined,
      authorId: BigInt(req.user.id),
      ciphertext: Buffer.from(ciphertext),
      iv: Buffer.from(iv),
    },
  });
  return res.send({ id });
}

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
