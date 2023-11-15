import { PrismaClient } from "@prisma/client";
import { prismaMock } from "./mock";

export const prisma =
  process.env.NODE_ENV === "test" ? prismaMock : new PrismaClient();
