import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

export type EncryptedEnvelope = {
  ciphertext: string;
  iv: string;
  authTag: string;
  version: number;
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // AES-GCM standard

function deriveKey(secret: string) {
  return createHash('sha256').update(secret).digest();
}

export function encryptJson<T>(payload: T, secret: string): EncryptedEnvelope {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encoded = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encoded.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    version: 1,
  };
}

export function decryptJson<T>(envelope: EncryptedEnvelope, secret: string): T {
  const key = deriveKey(secret);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(plaintext) as T;
}
