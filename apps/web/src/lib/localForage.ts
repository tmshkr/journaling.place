import localforage from "localforage";

export const cryptoStore = localforage.createInstance({
  name: "journaling.place",
  storeName: "crypto",
  driver: localforage.INDEXEDDB,
  description: "id: key-userId | salt-userId",
});

export const journalStore = localforage.createInstance({
  name: "journaling.place",
  storeName: "journals",
  driver: localforage.INDEXEDDB,
  description: "id: userId_promptId[_timestamp]",
  // timestamp is optional and should match the DB timestamp
});
