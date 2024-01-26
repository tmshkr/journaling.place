import { signOut } from "next-auth/react";
import { cryptoStore, journalStore } from "src/services/localForage";
import { clearKey } from "src/services/crypto";

export function logout() {
  clearKey();
  signOut();
  cryptoStore.clear();
  journalStore.clear();
}
