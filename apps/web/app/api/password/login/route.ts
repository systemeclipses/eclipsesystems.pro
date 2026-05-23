import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { createPasswordSession, setAuthSessionCookie } from "@/src/auth-session";
import { normalizeEmail, verifyPassword } from "@/src/auth-password";
import { db } from "@/src/db";
import { passwordCredentials, users } from "@/src/db/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const [record] = await db
    .select({
      userId: users.id,
      passwordHash: passwordCredentials.passwordHash,
      passwordSalt: passwordCredentials.passwordSalt
    })
    .from(users)
    .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
    .where(eq(users.email, email))
    .limit(1);

  if (!record || !(await verifyPassword(password, record.passwordHash, record.passwordSalt))) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const session = await createPasswordSession(record.userId);
  const response = NextResponse.json({ ok: true });
  setAuthSessionCookie(response, request, session.sessionToken, session.expires);

  return response;
}
