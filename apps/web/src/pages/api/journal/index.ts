import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).post(handlePost);

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
      promptId: promptId ? promptId : undefined,
      authorId: req.user.id,
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
