import { QueryFunctionContext, QueryKey } from "react-query";
import { queryClient } from "src/pages/_app";
import { JournalStatus } from "@prisma/client";
import store from "src/store";
import { setNetworkStatus, NetworkStatus } from "src/store/network";
import { trpc } from "src/lib/trpc";
const { Index } = require("flexsearch");

import { decrypt } from "src/lib/crypto";
import { toArrayBuffer } from "src/utils/buffer";

export const journalIndex = new Index({
  preset: "default",
  tokenize: "full",
  resolution: 5,
});

type JSONBuffer = {
  type: "Buffer";
  data: number[];
};

export type CachedJournal = {
  id: string;
  authorId: string;
  promptId?: string | null;
  ciphertext?: JSONBuffer | ArrayBuffer | null;
  iv?: JSONBuffer | Uint8Array | null;
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

type SyncArgs = QueryFunctionContext<QueryKey, any> & {
  fullSync?: boolean;
};

export async function sync(args?: SyncArgs) {
  const { user } = store.getState();
  if (!user.value) {
    queryClient.cancelQueries({ queryKey: args?.queryKey });
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
  store.dispatch(setNetworkStatus(NetworkStatus.pending));
  const { journals, ts, nextCursor } = await trpc.journal.getJournals.query({
    cursor,
    ts: cache.ts,
  });

  for (let i = 0; i < journals.length; i++) {
    const j: CachedJournal = journals[i];
    cache.journalsById[j.id] = j;

    if (j.status !== JournalStatus.DELETED) {
      j.ciphertext = toArrayBuffer((j.ciphertext as JSONBuffer).data);
      j.iv = new Uint8Array((j.iv as JSONBuffer).data);
      const decrypted = await decrypt(j.ciphertext, j.iv);

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

  if (nextCursor) {
    return getJournals(nextCursor);
  }

  cache.ts = ts;
  store.dispatch(setNetworkStatus(NetworkStatus.succeeded));
  return cache;
}
