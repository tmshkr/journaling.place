if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: "../../.env" });
}

import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
const cookie = require("cookie");
export const prisma: PrismaClient = new PrismaClient();

import { inferAsyncReturnType } from "@trpc/server";
import { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";

export async function createContext(
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) {
  const req: any = { cookies: cookie.parse(opts.req.headers.cookie || "") };
  const token = await getToken({ req });
  return { token, prisma };
}

export type Context = inferAsyncReturnType<typeof createContext>;