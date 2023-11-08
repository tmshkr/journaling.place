import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";

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
