import { NotificationTopic } from "@prisma/client";
import { mongoClient } from "src/lib/mongo";
import { decode } from "next-auth/jwt";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";
import path from "path";
const createError = require("http-errors");
const pug = require("pug");

async function handleToken(token: string) {
  if (!token) {
    throw createError.BadRequest("No token provided");
  }

  try {
    const decodedToken = await decode({
      token: token as string,
      secret: process.env.EMAIL_SECRET!,
    });
    if (!decodedToken) throw new Error("Token is not valid");
    z.object({
      email: z.string(),
      topic: z.enum(Object.keys(NotificationTopic) as any),
    }).parse(decodedToken);

    return decodedToken;
  } catch (err) {
    throw createError.BadRequest("Token is not valid");
  }
}

const unsubscribePage = pug.compileFile(
  path.resolve(process.cwd(), "src/pages/api/email/unsubscribe.pug")
);
const unsubscribedPage = pug.compileFile(
  path.resolve(process.cwd(), "src/pages/api/email/unsubscribed.pug")
);

const router = createRouter<NextApiRequest, NextApiResponse>();
router.get(handleGet).post(handlePost);

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { email, list_name } = await handleToken(req.query.token as string);
  return res.send(unsubscribePage({ url: req.url, email, list_name }));
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email, topic, list_name } = await handleToken(
    req.query.token as string
  );

  await mongoClient
    .db()
    .collection("User")
    .updateOne({ email }, { $pull: { emailNotifications: topic } });

  return res.send(unsubscribedPage({ email, list_name }));
}

export default router.handler({
  onError: (err: any, req, res) => {
    console.error(err);
    if (err.status && err.message) {
      res.status(err.status).end(err.message);
    } else {
      res.status(500).end("Something broke!");
    }
  },
  onNoMatch: (req, res) => {
    res.status(404).end("Page is not found");
  },
});
