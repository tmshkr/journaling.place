import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).put(handlePut);

async function handlePut(req, res) {
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
