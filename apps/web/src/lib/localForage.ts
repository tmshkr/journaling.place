import localforage from "localforage";

export const cryptoStore = localforage.createInstance({
  name: "journaling.place",
  storeName: "crypto",
  driver: localforage.INDEXEDDB,
});

export const journalStore = localforage.createInstance({
  name: "journaling.place",
  storeName: "journal",
  driver: localforage.INDEXEDDB,
});
