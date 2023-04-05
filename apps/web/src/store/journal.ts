import axios from "axios";
import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

const { Index } = require("flexsearch");

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

export async function getJournals(cache = {}, cursor = undefined) {
  const nextCursor = await axios
    .get("/api/journal", { params: { cursor } })
    .then(async ({ data }) => {
      const { journals, nextCursor } = data;
      for (const entry of journals) {
        cache[entry.id] = entry;
        entry.ciphertext = toArrayBuffer(entry.ciphertext.data);
        entry.iv = new Uint8Array(entry.iv.data);
        entry.decrypted = await decrypt(entry.ciphertext, entry.iv);
        journalIndex.add(Number(entry.id), entry.promptText);
        journalIndex.append(Number(entry.id), entry.decrypted);
      }
      return nextCursor;
    });

  return nextCursor ? getJournals(cache, nextCursor) : cache;
}
