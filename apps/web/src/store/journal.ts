import axios from "axios";
const { Index } = require("flexsearch");

import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

const cache = { journalsById: {}, journalsByPromptId: {}, ts: 0 };
const quillWorker: any = { current: null };

export async function sync() {}

export async function getJournals(cursor = undefined) {
  if (typeof window === "undefined") return;
  if (!quillWorker.current) {
    const Quill = await import("quill").then((value) => value.default);
    quillWorker.current = new Quill(document.createElement("div"));
  }

  const nextCursor = await axios
    .get("/api/journal", { params: { cursor, ts: cache.ts } })
    .then(async ({ data }) => {
      const { journals, nextCursor, ts } = data;
      cache.ts = ts;
      for (const entry of journals) {
        cache.journalsById[entry.id] = entry;
        journalIndex.add(Number(entry.id), entry.promptText);

        entry.ciphertext = toArrayBuffer(entry.ciphertext.data);
        entry.iv = new Uint8Array(entry.iv.data);
        const decrypted = await decrypt(entry.ciphertext, entry.iv);

        try {
          quillWorker.current.setContents(JSON.parse(decrypted));
          entry.plaintext = quillWorker.current.getText();
        } catch (err) {
          entry.plaintext = decrypted;
        }

        journalIndex.append(Number(entry.id), entry.plaintext);
      }
      return nextCursor;
    });

  return nextCursor ? getJournals(nextCursor) : cache;
}
