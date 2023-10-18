import { router } from "../trpc";
import { journalRouter } from "./journal/journalRouter";

export const appRouter = router({
  journal: journalRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
