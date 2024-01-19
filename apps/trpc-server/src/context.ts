if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: "../../.env" });
}

import { getToken } from "next-auth/jwt";
import { prisma } from "common/prisma/client";
import { mongoClient } from "common/mongo/client";
const cookie = require("cookie");

import { inferAsyncReturnType } from "@trpc/server";
import { CreateHTTPContextOptions } from "@trpc/server/adapters/standalone";
import { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";

export async function createContext(
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) {
  const req: any = { cookies: cookie.parse(opts.req.headers.cookie || "") };
  const token = await getToken({ req });
  return { token, prisma, mongoClient };
}

export type Context = inferAsyncReturnType<typeof createContext>;
