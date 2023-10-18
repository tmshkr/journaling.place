import { QueryFunctionContext, QueryKey } from "react-query";
import { queryClient } from "src/pages/_app";
import { JournalStatus } from "@prisma/client";
import store from "src/store";
import { setNetworkStatus, NetworkStatus } from "src/store/network";
import { trpc } from "src/utils/trpc";
const { Index } = require("flexsearch");

import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";
import { journalStore } from "src/lib/localForage";

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

export type CachedJournal = {
  id: string;
  authorId: string;
  promptId?: string | null;
  ciphertext?: ArrayBuffer | null;
  iv?: Uint8Array | null;
  plaintext?: string;
  status: JournalStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  prompt: {
    id: string;
    text: string;
  } | null;
};

let quill;
let cache: {
  journalsById: Record<string, CachedJournal>;
  journalsByPromptId: Record<string, Set<string>>;
  ts: number;
} = { journalsById: {}, journalsByPromptId: {}, ts: 0 };

export type JournalCache = typeof cache;

async function loadCache() {
  console.log("Loading journals from IndexedDB");
  const savedJournals: CachedJournal[] = [];
  await journalStore.iterate(function (value, key) {
    if (key === "ts") {
      cache.ts = value as number;
    } else {
      savedJournals.push(value as CachedJournal);
    }
  });

  for (let j of savedJournals) {
    await processJournal(j).catch((err) => {
      console.error("Error processing journal", err);
    });
  }
  console.log("Done loading journals from IndexedDB");
}

async function processJournal(j: CachedJournal) {
  cache.journalsById[j.id] = j;

  if (j.ciphertext && j.iv) {
    const decrypted = await decrypt(
      j.ciphertext as ArrayBuffer,
      j.iv as Uint8Array
    );

    try {
      quill.setContents(JSON.parse(decrypted));
      j.plaintext = quill.getText();
    } catch (err) {
      j.plaintext = decrypted;
    }
  }

  if (j.status === JournalStatus.ACTIVE) {
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

export async function sync(
  args?: QueryFunctionContext<QueryKey, any>,
  fullSync?: boolean
) {
  const { user } = store.getState();
  if (!user.value) {
    queryClient.cancelQueries({ queryKey: args?.queryKey });
    return cache;
  }
  if (!quill) {
    const Quill = await import("quill").then((value) => value.default);
    quill = new Quill(document.createElement("div"));
  }

  if (fullSync) {
    cache = { journalsById: {}, journalsByPromptId: {}, ts: 0 };
    await journalStore
      .clear()
      .then(() => {
        console.log("Deleted local journal cache");
      })
      .catch(console.error);
  } else if (cache.ts === 0) {
    await loadCache();
  }

  return getJournals();
}

async function getJournals(cursor?: string) {
  store.dispatch(setNetworkStatus(NetworkStatus.pending));
  const { journals, ts, nextCursor } = await trpc.journal.getJournals.query({
    cursor,
    ts: cache.ts,
  });

  for (const j of journals) {
    if (j.ciphertext && j.iv) {
      (j as CachedJournal).ciphertext = toArrayBuffer(j.ciphertext.data);
      (j as CachedJournal).iv = new Uint8Array(j.iv.data);
    }
    journalStore.setItem(j.id, j);
    await processJournal(j as CachedJournal);
  }

  if (nextCursor) {
    return getJournals(nextCursor);
  }

  cache.ts = ts;
  store.dispatch(setNetworkStatus(NetworkStatus.succeeded));
  journalStore.setItem("ts", ts);
  return cache;
}
