import { Journal } from "@prisma/client";
import store from ".";
import { trpc } from "src/lib/trpc";
const { Index } = require("flexsearch");

import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

export type CachedJournal = Journal & {
  prompt?: {
    id: string;
    text: string;
  } | null;
} & {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  plaintext: string;
};

let quill;
let cache: {
  journalsById: Record<string, CachedJournal>;
  journalsByPromptId: Record<string, Set<string>>;
  ts: number;
} = { journalsById: {}, journalsByPromptId: {}, ts: 0 };

export async function sync(args?) {
  const { user } = store.getState();
  if (!user.value) {
    args?.signal?.cancel();
    return cache;
  }
  if (!quill) {
    const Quill = await import("quill").then((value) => value.default);
    quill = new Quill(document.createElement("div"));
  }

  if (args?.fullSync) {
    cache = { journalsById: {}, journalsByPromptId: {}, ts: 0 };
  }

  return getJournals();
}

async function getJournals(cursor?: string) {
  const { journals, ts, nextCursor } = await trpc.journal.getJournals.query({
    cursor,
    ts: cache.ts,
  });

  const parse = async (j): Promise<CachedJournal> => {
    if (j.status !== "DELETED") {
      j.ciphertext = toArrayBuffer(j.ciphertext!.data!);
      j.iv = new Uint8Array(j.iv!.data!);
      const decrypted = await decrypt(j.ciphertext, j.iv);

      try {
        quill.setContents(JSON.parse(decrypted));
        j.plaintext = quill.getText();
      } catch (err) {
        j.plaintext = decrypted;
      }
    }
    return j;
  };

  for (let i = 0; i < journals.length; i++) {
    const j = await parse(journals[i]);
    cache.journalsById[j.id] = j;

    if (j.status === "ACTIVE") {
      journalIndex.add(j.id, j.plaintext);
      if (j.prompt) {
        journalIndex.append(j.id, j.prompt.text);
        if (cache.journalsByPromptId[j.prompt.id]) {
          cache.journalsByPromptId[j.prompt.id].add(j.id);
        } else {
          cache.journalsByPromptId[j.prompt.id] = new Set([j.id]);
        }
      }
    } else {
      journalIndex.remove(j.id);
      if (j.promptId) {
        cache.journalsByPromptId[j.promptId]?.delete(j.id);
      }
    }
  }

  if (nextCursor) {
    return getJournals(nextCursor);
  }

  cache.ts = ts;
  return cache;
}
