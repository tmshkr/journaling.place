import { store } from "src/store";
import { setModal } from "src/store/modal";
import { cryptoStore } from "src/lib/localForage";
import { sync } from "src/store/journal";
import { trpc, resetTRPC } from "src/utils/trpc";
import { toArrayBuffer } from "src/utils/buffer";
import { authSession, queryClient } from "src/pages/_app";

let key: CryptoKey | null;
let salt: Uint8Array | null;

function getKey() {
  return key;
}

export function isKeySet() {
  return !!key;
}

export function clearKey() {
  key = null;
}

export async function setKey() {
  if (!authSession.data) {
    throw new Error("No session available");
  }
  const user: any = authSession.data.user;

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
    queryClient.fetchQuery({ queryKey: "journal" });
  } else {
    store.dispatch(
      setModal({ name: "PasswordInput", isVisible: true, keepOpen: true })
    );
  }
}

export async function createKey(password: string) {
  if (!authSession.data) {
    throw new Error("No session available");
  }
  const user: any = authSession.data.user;
  const salt = user.salt
    ? new Uint8Array(user.salt.data)
    : window.crypto.getRandomValues(new Uint8Array(16));

  // Derive a key from a password
  const keyMaterial = await getKeyMaterial(password);
  const key = await deriveKey(keyMaterial, salt);

  const testJournal = await trpc.journal.getTestJournal.query();
  if (testJournal) {
    if (!testJournal.ciphertext || !testJournal.iv) {
      throw new Error("No ciphertext or iv available");
    }
    try {
      await decrypt(
        toArrayBuffer(testJournal.ciphertext.data),
        new Uint8Array(testJournal.iv.data),
        key
      );
    } catch (err) {
      throw new Error("Decryption failed");
    }
  }

  // Persist salt to DB
  if (!user.salt) {
    await trpc.user.setSalt.mutate({
      salt: Buffer.from(salt) as any,
    });
  }

  // Persist key and salt to IndexedDB
  await cryptoStore.setItem("key", key);
  await cryptoStore.setItem("salt", salt);

  await updateSession();

  store.dispatch(setModal({ name: "PasswordInput", isVisible: false }));
  await setKey();
}

async function updateSession() {
  // Prevent session handler from running
  authSession.updating = true;
  // Update session
  await authSession.update();
  // Reconnect with new session
  await resetTRPC();
  authSession.updating = false;
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

export async function changePassword(oldPassword: string, newPassword: string) {
  const oldPasswordIsCorrect = await testPassword(oldPassword);
  if (!oldPasswordIsCorrect) {
    throw new Error("Incorrect password");
  }

  // sync with server
  const { journalsById } = await sync({ reset: true });
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
    });
  }

  await trpc.user.updatePassword.mutate({
    salt: Buffer.from(newSalt) as any,
    journals: updatedJournals,
  });

  // Clear old key and salt
  key = null;
  salt = null;

  // update local crypto store
  await cryptoStore.setItem("key", newKey);
  await cryptoStore.setItem("salt", newSalt);

  // Update session
  await updateSession();

  // Sync with server
  await sync({ reset: true });

  await setKey();
}
