import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "src/lib/prisma";

(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const count = await prisma.prompt.count();
  const skip = Math.floor(Math.random() * count);
  const [prompt] = await prisma.prompt.findMany({
    take: 1,
    skip,
    select: {
      id: true,
      text: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  const response: any = {};
  response.id = prompt.id;
  response.text = prompt.text;
  response.tags = prompt.tags.map(({ tag: { text } }) => text);
  response.formattedTags = response.tags.map((tag) => `#${tag}`).join(" ");
  response.url = `${process.env.NEXTAUTH_URL}/${prompt.id}`;

  res.status(200).json(response);
}
