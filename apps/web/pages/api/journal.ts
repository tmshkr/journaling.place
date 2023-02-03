import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).get(handleGet).put(handlePut);

async function handleGet(req, res) {
  let response;
  if (req.query.promptId) {
    response = await prisma.journal.findFirst({
      where: {
        authorId: BigInt(req.user.id),
        promptId: BigInt(req.query.promptId),
      },
    });
  } else {
    const journals = await prisma.journal.findMany({
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
    });
    response = journals.map(
      ({ id, ciphertext, iv, createdAt, updatedAt, prompt, promptId }) => ({
        id,
        ciphertext,
        iv,
        createdAt,
        updatedAt,
        promptText: prompt.text,
        promptId,
      })
    );
  }

  return res.json(response);
}

async function handlePut(req, res) {
  console.log("handlePut", req.body);
  const { ciphertext, iv, promptId, updatedAt } = req.body;
  // TODO: validate input
  const row = {
    promptId: BigInt(promptId),
    authorId: BigInt(req.user.id),
    ciphertext: Buffer.from(ciphertext),
    iv: Buffer.from(iv),
    updatedAt: new Date(updatedAt),
  };

  const { id } = await prisma.journal.upsert({
    where: {
      authorId_promptId: {
        authorId: BigInt(req.user.id),
        promptId: BigInt(promptId),
      },
    },
    create: row,
    update: row,
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
