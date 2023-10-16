import { router } from "..";
import { getJournals } from "./getJournals";
import { createJournal } from "./createJournal";
import { updateJournal } from "./updateJournal";

export const journalRouter = router({
  getJournals,
  createJournal,
  updateJournal,
});
