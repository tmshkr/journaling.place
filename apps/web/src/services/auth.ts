import { signOut } from "next-auth/react";
import { cryptoStore, journalStore } from "src/services/localForage";
import { clearKey } from "src/services/crypto";

export async function logout() {
  await cryptoStore.clear();
  await journalStore.clear();
  clearKey();
  signOut();
}
