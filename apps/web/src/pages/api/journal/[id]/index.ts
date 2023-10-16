import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).get(handleGet);

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

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
