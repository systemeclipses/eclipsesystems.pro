import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 256) return "Password is too long.";
  return null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64");
  const hash = (await scrypt(password, salt, keyLength)) as Buffer;

  return {
    passwordHash: hash.toString("base64"),
    passwordSalt: salt
  };
}

export async function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const stored = Buffer.from(passwordHash, "base64");
  const candidate = (await scrypt(password, passwordSalt, stored.length)) as Buffer;

  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}
