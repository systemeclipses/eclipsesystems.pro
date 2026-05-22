import { readFileSync } from "node:fs";
import { createPrivateKey, sign } from "node:crypto";

const ONE_HUNDRED_EIGHTY_DAYS = 60 * 60 * 24 * 180;

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function getApplePrivateKey() {
  if (process.env.APPLE_PRIVATE_KEY) return process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  if (process.env.APPLE_PRIVATE_KEY_PATH) return readFileSync(process.env.APPLE_PRIVATE_KEY_PATH, "utf8");
  throw new Error("Missing APPLE_PRIVATE_KEY or APPLE_PRIVATE_KEY_PATH");
}

const teamId = required("APPLE_TEAM_ID");
const keyId = required("APPLE_KEY_ID");
const clientId = required("APPLE_CLIENT_ID");
const privateKey = createPrivateKey(getApplePrivateKey());
const issuedAt = Math.floor(Date.now() / 1000);

const header = {
  alg: "ES256",
  kid: keyId
};

const payload = {
  iss: teamId,
  iat: issuedAt,
  exp: issuedAt + ONE_HUNDRED_EIGHTY_DAYS,
  aud: "https://appleid.apple.com",
  sub: clientId
};

const unsignedToken = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
const signature = sign("sha256", Buffer.from(unsignedToken), {
  key: privateKey,
  dsaEncoding: "ieee-p1363"
});

console.log(`${unsignedToken}.${base64url(signature)}`);
