import localforage from "localforage";

export const cryptoStore = localforage.createInstance({
  name: "journaling.place",
  storeName: "crypto",
  driver: localforage.INDEXEDDB,
  description: "id: key-userId | salt-userId",
});
