import { router } from "./index";
import { journalRouter } from "./journal/journalRouter";

export const appRouter = router({
  journal: journalRouter,
});

export type AppRouter = typeof appRouter;
