import axios from "axios";
import { journalStore } from "src/lib/localForage";
import { toArrayBuffer } from "src/utils/buffer";

export async function syncJournals(userId) {
  const journals = {};
  const local = {};
  const remote = {};

  await Promise.all([
    journalStore.iterate(function (value, key, iterationNumber) {
      if (key.startsWith(userId)) {
        journals[key] = moreRecent(journals[key], value);
        local[key] = value;
      }
    }),
    axios.get("/api/journal").then(({ data }) => {
      for (const journal of data) {
        const key = `${userId}_${journal.promptId}`;
        journal.updatedAt = new Date(journal.updatedAt);
        journal.ciphertext = toArrayBuffer(journal.ciphertext.data);
        journal.iv = new Uint8Array(journal.iv.data);
        journals[key] = moreRecent(journals[key], journal);
        remote[key] = journal;
      }
    }),
  ]);

  await updateSources(local, remote);
  return journals;
}

async function updateSources(local, remote) {
  const promises: any = [];
  for (const key in local) {
    if (!remote[key] || local[key].updatedAt > remote[key].updatedAt) {
      const journal = local[key];
      journal.promptId = key.split("_")[1];
      journal.ciphertext = Buffer.from(journal.ciphertext);
      journal.iv = Buffer.from(journal.iv);
      promises.push(axios.put("/api/journal", journal));
    }
  }
  for (const key in remote) {
    if (!local[key] || remote[key].updatedAt > local[key].updatedAt) {
      promises.push(journalStore.setItem(key, remote[key]));
    }
  }
  await Promise.all(promises);
}

function moreRecent(a, b) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b;
}
