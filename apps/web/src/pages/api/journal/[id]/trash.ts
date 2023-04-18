import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).patch(handlePatch);

async function handlePatch(req, res) {
  await prisma.journal
    .update({
      where: {
        id_authorId: {
          id: BigInt(req.query.id),
          authorId: BigInt(req.user.id),
        },
      },
      data: {
        status: "TRASHED",
      },
    })
    .catch((err) => {
      if (err.code === "P2025") {
        return res.status(404).json({ errorMessage: "Not Found" });
      }
      throw err;
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
