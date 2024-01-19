import { Session } from "next-auth";
import { store } from "src/store";
import { setModal } from "src/store/modal";
import { setUser } from "src/store/user";
import { cryptoStore, journalStore } from "src/lib/localForage";
import { sync } from "src/store/journal";
import { SettingsStatus } from "src/pages/settings";
import { trpc } from "src/utils/trpc";
import { queryClient } from "src/pages/_app";

let key: CryptoKey | null;
let salt: Uint8Array | null;

function getKey() {
  return key;
}

function getSalt() {
  return salt;
}

export function clearKey() {
  key = null;
}

export async function loadKey(user) {
  key = await cryptoStore.getItem(`key`);
  salt = await cryptoStore.getItem(`salt`);

  // check if local salt is the same as on the server
  if (user.salt && salt) {
    try {
      for (let i = 0; i < user.salt.data.length; i++) {
        if (user.salt.data[i] !== salt[i]) {
          throw new Error("Salt mismatch");
        }
      }
    } catch (err) {
      console.error(err);
      key = null;
      salt = null;
    }
  }

  if (key) {
    store.dispatch(setUser({ ...user, keyIsSet: true }));
    queryClient.fetchQuery({ queryKey: "journal" });
  } else {
    store.dispatch(
      setModal({ name: "PasswordInput", isVisible: true, keepOpen: true })
    );
  }
}

export async function createKey(
  password: string,
  user,
  updateSession: (data?: any) => Promise<Session | null>
) {
  if (user.salt) {
    salt = new Uint8Array(user.salt.data);
  } else {
    salt = window.crypto.getRandomValues(new Uint8Array(16));
  }

  // Derive a key from a password
  const keyMaterial = await getKeyMaterial(password);
  const key = await deriveKey(keyMaterial, salt);

  // Persist salt to DB
  if (!user.salt) {
    await trpc.user.setSalt.mutate({
      salt: Buffer.from(salt) as any,
    });
  }

  // Persist key and salt to IndexedDB
  await cryptoStore.setItem(`key`, key);
  await cryptoStore.setItem(`salt`, salt);

  // Update session and reload
  await updateSession();
  window.location.reload();
}

/*
  Get some key material to use as input to the deriveKey method.
  The key material is a password supplied by the user.
*/
async function getKeyMaterial(password: string) {
  if (!password) throw new Error("No password provided");
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

/*
  Given some key material and some random salt
  derive an AES-GCM key using PBKDF2.
*/
function deriveKey(keyMaterial: CryptoKey, salt: Uint8Array) {
  if (!keyMaterial) throw new Error("No key material provided");
  if (!salt) throw new Error("No salt provided");
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext: string, key = getKey()) {
  if (!key) throw new Error("No key provided");
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoded
  );
  return { ciphertext, iv };
}

export async function decrypt(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  key = getKey()
) {
  if (!key) throw new Error("No key provided");

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

export async function testPassword(password: string) {
  if (!salt) throw new Error("No salt available");
  if (!key) throw new Error("No key available");

  const testEncrypted = await encrypt("test");
  const keyMaterial = await getKeyMaterial(password);
  const testKey = await deriveKey(keyMaterial, salt);
  const testDecrypted = await decrypt(
    testEncrypted.ciphertext,
    testEncrypted.iv,
    testKey
  ).catch((err) => {
    console.log("Error decrypting", err);
  });

  return testDecrypted === "test";
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  update: (data?: any) => Promise<Session | null>
) {
  const oldPasswordIsCorrect = await testPassword(oldPassword);
  if (!oldPasswordIsCorrect) {
    throw new Error("Incorrect password");
  }

  // sync with server
  const { journalsById } = await sync(undefined, true);
  const updatedJournals: any = [];

  // create new key from new password
  const keyMaterial = await getKeyMaterial(newPassword);
  const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
  const newKey = await deriveKey(keyMaterial, newSalt);

  // decrypt then re-encrypt journals
  for (const id in journalsById) {
    const journal = journalsById[id];
    if (journal.status === "DELETED") continue;
    const decrypted = await decrypt(
      journal.ciphertext as ArrayBuffer,
      journal.iv as Uint8Array
    );
    const { ciphertext, iv } = await encrypt(decrypted, newKey);
    (journal as any).ciphertext = ciphertext;
    (journal as any).iv = iv;
    updatedJournals.push({
      id: journal.id,
      ciphertext: Buffer.from(ciphertext),
      iv: Buffer.from(iv),
      updatedAt: journal.updatedAt.toString(),
    });
  }

  const { user } = store.getState();
  store.dispatch(setUser({ ...user.value, updating: true }));

  await trpc.user.updatePassword.mutate({
    salt: Buffer.from(newSalt) as any,
    journals: updatedJournals,
  });

  // clear old journals from local store
  await journalStore.clear();

  // update local crypto store
  await cryptoStore.setItem("key", newKey);
  await cryptoStore.setItem("salt", newSalt);

  // Update session
  await update();
  window.location.href = `/settings?status=${SettingsStatus.PASSWORD_UPDATED}`;
}
