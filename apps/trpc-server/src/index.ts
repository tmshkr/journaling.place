if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: "../../.env" });
}

import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
const cookie = require("cookie");
const prisma: PrismaClient = new PrismaClient();

import { inferAsyncReturnType, initTRPC } from "@trpc/server";
import {
  CreateHTTPContextOptions,
  createHTTPServer,
} from "@trpc/server/adapters/standalone";
import {
  applyWSSHandler,
  CreateWSSContextFnOptions,
} from "@trpc/server/adapters/ws";
import { observable } from "@trpc/server/observable";
import { WebSocketServer } from "ws";
import { z } from "zod";

async function createContext(
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) {
  const req: any = { cookies: cookie.parse(opts.req.headers.cookie || "") };
  const token = await getToken({ req });
  return { token, prisma };
}
type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;
const router = t.router;

const journalRouter = router({
  getJournals: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        promptId: z.string().optional(),
        ts: z.date().optional(),
      })
    )
    .query(({ input }) => {
      console.log(input);
      return `Hello, world!`;
    }),
});

// Merge routers together
const appRouter = router({
  journal: journalRouter,
});

export type AppRouter = typeof appRouter;

// http server
const { server, listen } = createHTTPServer({
  router: appRouter,
  createContext,
});

// ws server
const wss = new WebSocketServer({ server });
applyWSSHandler<AppRouter>({
  wss,
  router: appRouter,
  createContext,
});

// setInterval(() => {
//   console.log('Connected clients', wss.clients.size);
// }, 1000);
listen(2022);
