import { router } from "./index";
import { journalRouter } from "./journal/journalRouter";
import { userRouter } from "./user/userRouter";

export const appRouter = router({
  journal: journalRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
