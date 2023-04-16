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

    // Check that the token's salt is correct
    if (user.salt) {
      for (let i = 0; i < user.salt.length; i++) {
        if (user.salt[i] !== nextToken.user.salt.data[i]) {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
      }
    }

    req.user = user;
    req.user.id = user.id.toString();

    return next();
  } catch (err: any) {
    console.error(err);
    if (err.name === "NotFoundError") {
      res.status(404).json({ errorMessage: "User not found" });
    } else res.status(401).json({ errorMessage: "Unauthorized" });
  }
};
