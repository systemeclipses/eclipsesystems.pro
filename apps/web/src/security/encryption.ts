import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const KEY_ID = "ops-onboarding-v1";

function keyMaterial() {
  const secret = process.env.ONBOARDING_ENCRYPTION_KEY || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.DATABASE_URL;
  if (!secret) throw new Error("ONBOARDING_ENCRYPTION_KEY or AUTH_SECRET is required for sensitive onboarding data.");
  return createHash("sha256").update(secret).digest();
}

export function encryptJson(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedData: Buffer.concat([iv, tag, ciphertext]).toString("base64"),
    keyId: KEY_ID
  };
}

export function decryptJson<T>(encryptedData: string): T {
  const payload = Buffer.from(encryptedData, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", keyMaterial(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as T;
}

export function last4(value: unknown) {
  const text = String(value ?? "").replace(/\D/g, "");
  return text.slice(-4);
}
