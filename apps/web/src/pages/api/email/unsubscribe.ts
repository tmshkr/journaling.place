import { NotificationTopic } from "@prisma/client";
import { mongoClient } from "src/lib/mongo";
import { decode } from "next-auth/jwt";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { z } from "zod";
import path from "path";
const createError = require("http-errors");
const pug = require("pug");

const router = createRouter<NextApiRequest, NextApiResponse>();
router.get(handleGet).post(handlePost);

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

const topicMeta = {
  prompt_of_the_day: {
    title: "Prompt of the Day",
  },
};

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { email, topic } = await handleToken(req.query.token as string);
  const unsubscribePage = pug.compileFile(
    path.resolve(process.cwd(), "src/pages/api/email/unsubscribe.pug")
  );
  return res.send(
    unsubscribePage({
      url: req.url,
      email,
      title: topicMeta[topic as string].title,
    })
  );
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { email, topic } = await handleToken(req.query.token as string);

  const unsubscribedPage = pug.compileFile(
    path.resolve(process.cwd(), "src/pages/api/email/unsubscribed.pug")
  );

  const resubscribedPage = pug.compileFile(
    path.resolve(process.cwd(), "src/pages/api/email/resubscribed.pug")
  );

  if (req.body.resubscribe) {
    await mongoClient
      .db()
      .collection("User")
      .updateOne({ email }, { $addToSet: { emailNotifications: topic } });
    return res.send(
      resubscribedPage({ email, title: topicMeta[topic as string].title })
    );
  } else {
    await mongoClient
      .db()
      .collection("User")
      .updateOne({ email }, { $pull: { emailNotifications: topic } });
    return res.send(
      unsubscribedPage({ email, title: topicMeta[topic as string].title })
    );
  }
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
