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
  let journals;
  if (req.query.promptId) {
    journals = await prisma.journal.findMany({
      where: {
        authorId: BigInt(req.user.id),
        promptId: BigInt(req.query.promptId),
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  } else {
    journals = await prisma.journal
      .findMany({
        where: {
          authorId: BigInt(req.user.id),
        },
        take: 100,
        orderBy: { updatedAt: "desc" },
        include: {
          prompt: {
            select: {
              text: true,
            },
          },
        },
      })
      .then((journals) =>
        journals.map(
          ({ id, ciphertext, iv, createdAt, updatedAt, prompt, promptId }) => ({
            id,
            ciphertext,
            iv,
            createdAt,
            updatedAt,
            promptText: prompt.text,
            promptId,
          })
        )
      );
  }

  return res.json(journals);
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
      promptId: z.string(),
    }).parse(req.body);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errorMessage: "Bad Request" });
  }

  const { ciphertext, iv, promptId } = req.body;
  const { id } = await prisma.journal.create({
    data: {
      promptId: BigInt(promptId),
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
