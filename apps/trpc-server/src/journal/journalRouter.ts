import { router } from "..";
import { getJournals } from "./getJournals";
import { createJournal } from "./createJournal";

export const journalRouter = router({
  getJournals,
  createJournal,
});
