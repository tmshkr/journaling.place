import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).put(handlePut);

async function handlePut(req, res) {
  const { salt } = req.body;
  if (!salt) {
    return res.status(400).end("Must provide salt");
  }
  const journals = req.body.journals || [];
  if (!Array.isArray(journals)) {
    return res.status(400).end("Journals must be an array");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: BigInt(req.user.id) },
      data: { salt: Buffer.from(salt) },
    }),
    ...journals.map(({ id, ciphertext, iv, updatedAt }) => {
      return prisma.journal.update({
        where: {
          id_authorId: {
            id: BigInt(id),
            authorId: BigInt(req.user.id),
          },
        },
        data: {
          ciphertext: Buffer.from(ciphertext),
          iv: Buffer.from(iv),
          updatedAt,
        },
      });
    }),
  ]);
  return res.send("OK");
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
