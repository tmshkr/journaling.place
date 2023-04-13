import axios from "axios";
import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

const { Index } = require("flexsearch");

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

const quillWorker: any = { current: null };

export async function getJournals(cache = {}, cursor = undefined) {
  if (typeof window === "undefined") return;
  if (!quillWorker.current) {
    const Quill = await import("quill").then((value) => value.default);
    quillWorker.current = new Quill(document.createElement("div"));
  }

  const nextCursor = await axios
    .get("/api/journal", { params: { cursor } })
    .then(async ({ data }) => {
      const { journals, nextCursor } = data;
      for (const entry of journals) {
        cache[entry.id] = entry;
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

  return nextCursor ? getJournals(cache, nextCursor) : cache;
}
