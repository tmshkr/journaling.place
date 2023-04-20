import axios from "axios";
import store from ".";
const { Index } = require("flexsearch");

import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

let cache = { journalsById: {}, journalsByPromptId: {}, ts: undefined };
let quill;

export async function sync(args?) {
  const { user } = store.getState();
  if (!user.value) {
    args?.signal?.cancel();
    return;
  }
  if (!quill) {
    const Quill = await import("quill").then((value) => value.default);
    quill = new Quill(document.createElement("div"));
  }

  if (args?.fullSync) {
    cache = { journalsById: {}, journalsByPromptId: {}, ts: undefined };
  }

  return getJournals();
}

async function getJournals(cursor?) {
  return axios
    .get("/api/journal", { params: { cursor, ts: cache.ts } })
    .then(async ({ data }) => {
      const { journals, nextCursor, ts } = data;

      for (const entry of journals) {
        if (entry.status !== "ACTIVE") {
          journalIndex.remove(Number(entry.id));
          const promptId = cache.journalsById[entry.id]?.promptId;
          if (promptId) {
            cache.journalsByPromptId[promptId].delete(entry.id);
          }
        }

        cache.journalsById[entry.id] = entry;

        if (entry.status !== "DELETED") {
          entry.ciphertext = toArrayBuffer(entry.ciphertext.data);
          entry.iv = new Uint8Array(entry.iv.data);
          const decrypted = await decrypt(entry.ciphertext, entry.iv);

          try {
            quill.setContents(JSON.parse(decrypted));
            entry.plaintext = quill.getText();
          } catch (err) {
            entry.plaintext = decrypted;
          }
        }

        if (entry.status === "ACTIVE") {
          journalIndex.add(Number(entry.id), entry.plaintext);
          if (entry.promptId) {
            journalIndex.append(Number(entry.id), entry.prompt.text);
            if (cache.journalsByPromptId[entry.promptId]) {
              cache.journalsByPromptId[entry.promptId].add(entry.id);
            } else {
              cache.journalsByPromptId[entry.promptId] = new Set([entry.id]);
            }
          }
        }
      }

      if (nextCursor) {
        return getJournals(nextCursor);
      }

      cache.ts = ts;
      return cache;
    });
}
