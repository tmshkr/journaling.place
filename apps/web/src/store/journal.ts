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
  if (typeof window === "undefined") return;
  const Quill = await import("quill").then((value) => value.default);
  const quillWorker = new Quill(document.createElement("div"));

  const nextCursor = await axios
    .get("/api/journal", { params: { cursor } })
    .then(async ({ data }) => {
      const { journals, nextCursor } = data;
      for (const entry of journals) {
        cache[entry.id] = entry;
        journalIndex.add(Number(entry.id), entry.promptText);

        entry.ciphertext = toArrayBuffer(entry.ciphertext.data);
        entry.iv = new Uint8Array(entry.iv.data);
        entry.decrypted = await decrypt(entry.ciphertext, entry.iv);

        try {
          quillWorker.setContents(JSON.parse(entry.decrypted));
          entry.plaintext = quillWorker.getText();
          journalIndex.append(Number(entry.id), entry.plaintext);
        } catch (err) {
          entry.plaintext = entry.decrypted;
        }

        journalIndex.append(Number(entry.id), entry.plaintext);
      }
      return nextCursor;
    });

  return nextCursor ? getJournals(cache, nextCursor) : cache;
}
