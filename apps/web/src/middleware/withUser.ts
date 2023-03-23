import { prisma } from "src/lib/prisma";
import { getToken } from "next-auth/jwt";

export const withUser = async (req, res, next) => {
  const nextToken: any = await getToken({ req });
  if (!nextToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { sub } = nextToken;
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: BigInt(sub) },
    });

    (user as any).id = user.id.toString();
    req.user = user;

    return next();
  } catch (err: any) {
    console.error(err);
    if (err.name === "NotFoundError") {
      res.status(404).json({ errorMessage: "User not found" });
    } else res.status(401).json({ errorMessage: "Unauthorized" });
  }
};
