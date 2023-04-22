import { cryptoStore } from "src/lib/localForage";
import { sync } from "src/store/journal";
import axios from "axios";

const store: {
  key: CryptoKey | undefined;
  salt: Uint8Array | undefined;
} = {
  key: undefined,
  salt: undefined,
};

function getKey() {
  return store.key;
}

export function setKey(newKey: CryptoKey) {
  store.key = newKey;
}

export function clearKey() {
  store.key = undefined;
}

function isKeySet() {
  return !!store.key;
}

export async function handleKey(salt?: Uint8Array) {
  store.salt = salt || window.crypto.getRandomValues(new Uint8Array(16));

  if (isKeySet()) return;
  const localKey: CryptoKey | null = await cryptoStore.getItem(`key`);

  if (localKey) {
    setKey(localKey);
    return;
  }

  // Derive a key from a password
  const keyMaterial = await getKeyMaterial();
  const key = await deriveKey(keyMaterial, store.salt);
  setKey(key);

  // Persist the key to IndexedDB
  await cryptoStore.setItem(`key`, key);

  // Persist salt to DB
  await axios.put("/api/me/password", { salt: Buffer.from(store.salt) });
  window.location.href += "?";
}

/*
  Get some key material to use as input to the deriveKey method.
  The key material is a password supplied by the user.
*/
function getKeyMaterial(password?: string) {
  if (!password) {
    password =
      window.prompt(
        "Please enter your password.\nUse a strong password and store it in a safe place.\nIf you lose your password, your data cannot be recovered."
      ) || undefined;
  }

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

  const decrypted = await window.crypto.subtle
    .decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ciphertext
    )
    .catch((err) => {
      console.log("Error decrypting", err);
    });

  if (!decrypted) {
    throw new Error("No decrypted value");
  }

  let dec = new TextDecoder();

  return dec.decode(decrypted);
}

export async function testPassword(password: string) {
  const testEncrypted = await encrypt("test");
  const keyMaterial = await getKeyMaterial(password);
  const key = await deriveKey(keyMaterial, store.salt as Uint8Array);
  const testDecrypted = await decrypt(
    testEncrypted.ciphertext,
    testEncrypted.iv,
    key
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
  const { journalsById } = await sync({ fullSync: true });
  const updatedJournals: any = [];

  // create new key from new password
  const keyMaterial = await getKeyMaterial(newPassword);
  const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
  const newKey = await deriveKey(keyMaterial, newSalt);

  // decrypt then re-encrypt journals
  for (const id in journalsById) {
    const journal = journalsById[id];
    if (journal.status === "DELETED") continue;
    const decrypted = await decrypt(journal.ciphertext, journal.iv);
    const { ciphertext, iv } = await encrypt(decrypted, newKey);
    journal.ciphertext = ciphertext;
    journal.iv = iv;
    updatedJournals.push({
      id: journal.id,
      ciphertext: Buffer.from(ciphertext),
      iv: Buffer.from(iv),
      updatedAt: journal.updatedAt,
    });
  }

  // sync new encrypted data and salt with server
  await axios.put("/api/me/password", {
    salt: Buffer.from(newSalt),
    journals: updatedJournals,
  });

  // update local crypto store
  await cryptoStore.setItem("key", newKey);

  store.key = newKey;
  store.salt = newSalt;
}
