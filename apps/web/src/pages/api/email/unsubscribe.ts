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
      email: z.string().email(),
    }).parse(decodedToken);

    return decodedToken;
  } catch (err) {
    throw createError.BadRequest("Token is not valid");
  }
}

const topicMeta = {
  prompt_of_the_day: {
    key: "prompt_of_the_day",
    title: "Prompt of the Day",
  },
};

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const topic = topicMeta[req.query.topic as string];
  if (!topic) throw createError.BadRequest("Invalid topic");

  const { email } = await handleToken(req.query.token as string);

  const user = await mongoClient
    .db()
    .collection("User")
    .findOne({ email }, { projection: { emailNotifications: 1 } });

  if (!user) throw createError.NotFound("User not found");

  if (user.emailNotifications.includes(topic.key)) {
    return res.send(
      pug.renderFile(
        path.resolve(process.cwd(), "src/pages/api/email/unsubscribe.pug"),
        {
          email,
          title: topic.title,
        }
      )
    );
  } else {
    return res.send(
      pug.renderFile(
        path.resolve(
          process.cwd(),
          "src/pages/api/email/already-unsubscribed.pug"
        ),
        {
          email,
          title: topic.title,
        }
      )
    );
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const topic = topicMeta[req.query.topic as string];
  if (!topic) throw createError.BadRequest("Invalid topic");
  const { email } = await handleToken(req.query.token as string);

  if (req.body.resubscribe) {
    await mongoClient
      .db()
      .collection("User")
      .updateOne({ email }, { $addToSet: { emailNotifications: topic.key } });

    return res.send(
      pug.renderFile(
        path.resolve(process.cwd(), "src/pages/api/email/resubscribed.pug"),
        { email, title: topic.title }
      )
    );
  } else {
    await mongoClient
      .db()
      .collection("User")
      .updateOne({ email }, { $pull: { emailNotifications: topic.key } });

    return res.send(
      pug.renderFile(
        path.resolve(process.cwd(), "src/pages/api/email/unsubscribed.pug"),
        { email, title: topic.title }
      )
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
