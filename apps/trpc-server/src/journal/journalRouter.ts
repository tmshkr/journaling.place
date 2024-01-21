import { router } from "..";
import { getJournals } from "./getJournals";
import { getTestJournal } from "./getTestJournal";
import { createJournal } from "./createJournal";
import { updateJournal } from "./updateJournal";
import { updateJournalStatus } from "./updateJournalStatus";

export const journalRouter = router({
  getJournals,
  getTestJournal,
  createJournal,
  updateJournal,
  updateJournalStatus,
});
