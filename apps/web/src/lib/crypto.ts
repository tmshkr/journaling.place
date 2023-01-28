import { cryptoStore } from "src/lib/localForage";
import axios from "axios";

let key: CryptoKey | undefined;

function getKey() {
  return key;
}

export function setKey(newKey: CryptoKey) {
  key = newKey;
}

export function clearKey() {
  key = undefined;
}

function isKeySet() {
  return !!key;
}

export async function handleKey(userId: bigint, salt?: Uint8Array) {
  if (isKeySet()) return;
  const localKey: CryptoKey | null = await cryptoStore.getItem(`key-${userId}`);
  const localSalt: Uint8Array | null = await cryptoStore.getItem(
    `salt-${userId}`
  );

  if (salt && localSalt) {
    if (salt.toString() !== localSalt.toString()) {
      // TODO: Handle salt mismatch
      throw new Error("Salts do not match");
    }
  }
  if (localKey && localSalt) {
    setKey(localKey);
    return;
  }

  // Derive a key from a password
  const keyMaterial = await getKeyMaterial();
  salt = salt || window.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(keyMaterial, salt);
  setKey(key);
  const now = new Date();

  // Persist the key and salt to IndexedDB
  await cryptoStore.setItem(`key-${userId}`, key);
  await cryptoStore.setItem(`salt-${userId}`, salt);
  await cryptoStore.setItem(`updatedAt-${userId}`, now);

  // Persist salt to DB
  await axios.put("/api/me", { salt: Buffer.from(salt) });
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
function deriveKey(keyMaterial, salt) {
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

export async function testPassword(userId: bigint, password: string) {
  const testEncrypted = await encrypt("test");
  const keyMaterial = await getKeyMaterial(password);
  const salt = await cryptoStore.getItem(`salt-${userId}`);
  const key = await deriveKey(keyMaterial, salt);
  const testDecrypted = await decrypt(
    testEncrypted.ciphertext,
    testEncrypted.iv,
    key
  ).catch((err) => {
    console.log("Error decrypting", err);
  });

  return testDecrypted === "test";
}

export async function createNewKeyFromPassword(password: string) {
  const keyMaterial = await getKeyMaterial(password);
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(keyMaterial, salt);
  return { key, salt };
}
