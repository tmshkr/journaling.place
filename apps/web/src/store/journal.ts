import axios from "axios";
import dayjs from "src/lib/dayjs";
import { decrypt } from "src/lib/crypto";
import { journalStore } from "src/lib/localForage";
import { toArrayBuffer } from "src/utils/buffer";

const { Index } = require("flexsearch");

export const journalIndex = {};

export async function getJournal(userId) {
  journalIndex[userId || "null"] = new Index({
    preset: "default",
    tokenize: "full",
    resolution: 5,
  });

  let journal = {};
  if (userId) {
    journal = await syncJournals(userId, journalIndex);
  } else {
    await journalStore.iterate(function (value: any, key, iterationNumber) {
      if (key.startsWith("null")) {
        journal[key] = value;
        journalIndex["null"].add(key, value.promptText);
        journalIndex["null"].append(key, value.plaintext);
      }
    });
  }

  return journal;
}

async function syncJournals(userId, index) {
  const local = {};
  const remote = {};

  await Promise.all([
    journalStore.iterate(function (entry, key, iterationNumber) {
      if (key.startsWith(userId)) {
        local[key] = entry;
      }
    }),
    axios.get("/api/journal").then(({ data }) => {
      for (const entry of data) {
        const key = `${userId}_${entry.promptId}`;
        entry.ciphertext = toArrayBuffer(entry.ciphertext.data);
        entry.iv = new Uint8Array(entry.iv.data);
        remote[key] = entry;
      }
    }),
  ]);

  const journal = await combineSources(local, remote, index[userId]);
  return journal;
}

async function combineSources(local, remote, index) {
  const journal = {};
  const promises: any = [];

  for (const key in remote) {
    const entry = remote[key];
    const isAfter = dayjs(entry.updatedAt).isAfter(local[key].updatedAt);
    const isSame = dayjs(entry.updatedAt).isSame(local[key].updatedAt);
    if (!local[key] || isAfter) {
      journal[key] = entry;
      entry.decrypted = await decrypt(entry.ciphertext, entry.iv);
      index.add(key, entry.promptText);
      index.append(key, entry.decrypted);
      promises.push(journalStore.setItem(key, entry));
    } else if (isSame) {
      journal[key] = entry;
      entry.decrypted = await decrypt(entry.ciphertext, entry.iv);
      index.add(key, entry.promptText);
      index.append(key, entry.decrypted);
    }
  }

  for (const key in local) {
    const entry = local[key];
    const isAfter = dayjs(entry.updatedAt).isAfter(remote[key].updatedAt);
    if (!remote[key] || isAfter) {
      journal[key] = entry;
      entry.decrypted = await decrypt(entry.ciphertext, entry.iv);
      index.add(key, entry.promptText);
      index.append(key, entry.decrypted);

      promises.push(
        axios.put("/api/journal", {
          promptId: key.split("_")[1],
          ciphertext: Buffer.from(entry.ciphertext),
          iv: Buffer.from(entry.iv),
          updatedAt: entry.updatedAt,
        })
      );
    }
  }

  await Promise.all(promises);

  return journal;
}
