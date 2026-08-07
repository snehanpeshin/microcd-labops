const encoder = new TextEncoder();
const decoder = new TextDecoder();
const iterations = 310_000;
const asArrayBuffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const bytesToBase64 = (bytes: Uint8Array) => {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
};

const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

export type EncryptedPayload = {
  version: 1;
  algorithm: "AES-256-GCM";
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: asArrayBuffer(salt), iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptLocalDocument(value: unknown, passphrase: string): Promise<EncryptedPayload> {
  if (passphrase.length < 12) throw new Error("Use a passphrase with at least 12 characters");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: asArrayBuffer(iv) }, key, encoder.encode(JSON.stringify(value)));
  return { version: 1, algorithm: "AES-256-GCM", kdf: "PBKDF2-SHA-256", iterations, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

export async function decryptLocalDocument<T>(payload: EncryptedPayload, passphrase: string): Promise<T> {
  if (payload.version !== 1 || payload.algorithm !== "AES-256-GCM") throw new Error("Unsupported encrypted document format");
  const key = await deriveKey(passphrase, base64ToBytes(payload.salt));
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(base64ToBytes(payload.iv)) }, key, asArrayBuffer(base64ToBytes(payload.ciphertext)));
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch {
    throw new Error("The passphrase is incorrect or the encrypted data was modified");
  }
}
