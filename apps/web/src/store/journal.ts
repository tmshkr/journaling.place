import axios from "axios";
import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

const { Index } = require("flexsearch");

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

export async function getJournal(userId) {
  let journal = {};
  if (userId) {
    journal = await syncJournals(userId);
  }

  return journal;
}

export async function syncJournals(userId) {
  const journal = {};

  await axios.get("/api/journal").then(async ({ data }) => {
    for (const entry of data) {
      journal[entry.id] = entry;
      entry.ciphertext = toArrayBuffer(entry.ciphertext.data);
      entry.iv = new Uint8Array(entry.iv.data);
      entry.decrypted = await decrypt(entry.ciphertext, entry.iv);
      journalIndex.add(Number(entry.id), entry.promptText);
      journalIndex.append(Number(entry.id), entry.decrypted);
    }
  });

  return journal;
}
