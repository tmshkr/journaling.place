import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).put(handlePut);

async function handlePut(req, res) {
  const { isSubscribedPOTD } = req.body;

  await prisma.user.update({
    where: { id: BigInt(req.user.id) },
    data: { isSubscribedPOTD },
  });

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
