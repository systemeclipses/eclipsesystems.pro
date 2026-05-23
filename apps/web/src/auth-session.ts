import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/src/db";
import { sessions } from "@/src/db/schema";

const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function shouldUseSecureCookie(request: NextRequest) {
  return request.nextUrl.protocol === "https:" || process.env.AUTH_URL?.startsWith("https://") || process.env.NEXTAUTH_URL?.startsWith("https://");
}

export async function createPasswordSession(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + sessionMaxAgeSeconds * 1000);

  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires
  });

  return { sessionToken, expires };
}

export function setAuthSessionCookie(response: NextResponse, request: NextRequest, sessionToken: string, expires: Date) {
  const secure = shouldUseSecureCookie(request);
  const name = secure ? "__Secure-authjs.session-token" : "authjs.session-token";

  response.cookies.set(name, sessionToken, {
    expires,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/"
  });
}
