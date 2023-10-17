import { router } from "..";
import { getJournals } from "./getJournals";
import { createJournal } from "./createJournal";
import { updateJournal } from "./updateJournal";
import { updateJournalStatus } from "./updateJournalStatus";

export const journalRouter = router({
  getJournals,
  createJournal,
  updateJournal,
  updateJournalStatus,
});
