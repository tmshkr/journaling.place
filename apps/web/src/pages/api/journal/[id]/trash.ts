import { withUser } from "src/middleware/withUser";
import { prisma } from "src/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(withUser).patch(handlePatch).delete(handleDelete);

export async function handlePatch(req, res) {
  try {
    z.object({
      status: z.enum(["TRASHED", "ACTIVE"]),
    }).parse(req.body);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errorMessage: "Bad Request" });
  }

  const { status } = req.body;
  await prisma.journal
    .update({
      where: {
        id_authorId: {
          id: BigInt(req.query.id),
          authorId: BigInt(req.user.id),
        },
      },
      data: {
        status,
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

async function handleDelete(req, res) {
  await prisma.journal
    .update({
      where: {
        id_authorId: {
          id: BigInt(req.query.id),
          authorId: BigInt(req.user.id),
        },
      },
      data: {
        status: "DELETED",
        ciphertext: null,
        iv: null,
        promptId: null,
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
    if (
      err.message.includes("Cannot update a deleted record") ||
      err.message.includes("Cannot delete an active record")
    ) {
      return res.status(403).json({ errorMessage: "Forbidden" });
    }
    console.error(err.stack);
    res.status(500).end("Something broke!");
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
