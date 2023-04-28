import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).get(handleGet).put(handlePut);

async function handleGet(req, res) {
  const journal = await prisma.journal.findUnique({
    where: {
      id_authorId: {
        id: req.query.id,
        authorId: req.user.id,
      },
    },
    include: {
      prompt: {
        select: {
          id: true,
          text: true,
        },
      },
    },
  });

  if (!journal) {
    return res.status(404).send();
  }

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
        id: req.query.id,
        authorId: req.user.id,
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
