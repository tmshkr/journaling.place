import { index } from "src/lib/flexsearch";
import { journalStore } from "src/lib/localForage";
import { syncJournals } from "src/utils/syncJournals";

export async function getJournal(userId) {
  console.log("getJournal", userId);
  let journal = {};
  if (userId) {
    journal = await syncJournals(userId);
  } else {
    await journalStore.iterate(function (value: any, key, iterationNumber) {
      if (key.startsWith("null")) {
        journal[key] = value;
        index.add(key, value.plaintext);
      }
    });
  }

  return journal;
}
