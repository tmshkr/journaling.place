import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";

(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).get(handleGet).put(handlePut);

async function handleGet(req, res) {
  const journal = await prisma.journal
    .findUniqueOrThrow({
      where: {
        id_authorId: {
          id: BigInt(req.query.id),
          authorId: BigInt(req.user.id),
        },
      },
      include: {
        prompt: {
          select: {
            text: true,
          },
        },
      },
    })
    .then(({ id, ciphertext, iv, createdAt, updatedAt, prompt, promptId }) => ({
      id,
      ciphertext,
      iv,
      createdAt,
      updatedAt,
      promptText: prompt?.text,
      promptId,
    }));
  return res.json(journal);
}

async function handlePut(req, res) {
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
    }).parse(req.body);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errorMessage: "Bad Request" });
  }

  const { ciphertext, iv } = req.body;
  await prisma.journal.update({
    where: {
      id_authorId: {
        id: BigInt(req.query.id),
        authorId: BigInt(req.user.id),
      },
    },
    data: {
      ciphertext: Buffer.from(ciphertext),
      iv: Buffer.from(iv),
    },
  });

  return res.send();
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
