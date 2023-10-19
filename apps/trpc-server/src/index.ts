if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: "../../.env" });
}

import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
const cookie = require("cookie");

export const prisma: PrismaClient = new PrismaClient();

import { inferAsyncReturnType, initTRPC, TRPCError } from "@trpc/server";
import {
  CreateHTTPContextOptions,
  createHTTPServer,
} from "@trpc/server/adapters/standalone";
import {
  applyWSSHandler,
  CreateWSSContextFnOptions,
} from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

async function createContext(
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) {
  const req: any = { cookies: cookie.parse(opts.req.headers.cookie || "") };
  const token = await getToken({ req });
  return { token, prisma };
}
type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create();

export const publicProcedure = t.procedure;
export const router = t.router;
export const middleware = t.middleware;

export const authorizedProcedure = publicProcedure.use(
  middleware(async (opts) => {
    try {
      const { ctx } = opts;
      const { token, prisma } = ctx;
      if (!token) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No token" });
      }
      const { sub } = token;
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: sub },
      });

      // Check that the token's salt is correct
      if (user.salt) {
        for (let i = 0; i < user.salt.length; i++) {
          if (user.salt[i] !== (token as any).user.salt.data[i]) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Bad salt" });
          }
        }
      }

      return opts.next({
        ctx: {
          user,
        },
      });
    } catch (error) {
      console.error(error);
      throw new TRPCError({
        code: "UNAUTHORIZED",
      });
    }
  })
);

import { journalRouter } from "./journal/journalRouter";

export const appRouter = router({
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

listen(2222);
