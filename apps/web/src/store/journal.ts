import { journalStore } from "src/lib/localForage";
import { syncJournals } from "src/utils/syncJournals";

const { Index } = require("flexsearch");

export const journalIndex = {
  null: new Index({
    preset: "default",
    tokenize: "full",
    resolution: 5,
  }),
};

export async function getJournal(userId) {
  console.log("getJournal", userId);

  let journal = {};
  if (userId) {
    journal = await syncJournals(userId);
  } else {
    await journalStore.iterate(function (value: any, key, iterationNumber) {
      if (key.startsWith("null")) {
        journal[key] = value;
        journalIndex["null"].add(key, value.plaintext);
      }
    });
  }

  return journal;
}
