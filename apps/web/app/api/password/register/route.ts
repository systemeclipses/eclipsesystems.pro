import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { createPasswordSession, setAuthSessionCookie } from "@/src/auth-session";
import { hashPassword, normalizeEmail, validatePassword } from "@/src/auth-password";
import { db } from "@/src/db";
import { passwordCredentials, users } from "@/src/db/schema";
import { ensureTrialSubscriptionForOrganization } from "@/src/db/queries/billing";
import { ensurePersonalOrganizationForUser } from "@/src/db/queries/organizations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; confirmPassword?: string; name?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";
  const confirmPassword = body?.confirmPassword ?? "";
  const name = body?.name?.trim() || null;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (user) {
    const [existingCredential] = await db
      .select({ userId: passwordCredentials.userId })
      .from(passwordCredentials)
      .where(eq(passwordCredentials.userId, user.id))
      .limit(1);

    if (existingCredential) {
      return NextResponse.json({ error: "An account with that email already exists. Sign in instead." }, { status: 409 });
    }
  } else {
    [user] = await db
      .insert(users)
      .values({
        email,
        name
      })
      .returning();
  }

  const credential = await hashPassword(password);

  await db.insert(passwordCredentials).values({
    userId: user.id,
    ...credential
  });

  const organizationId = await ensurePersonalOrganizationForUser(user);
  await ensureTrialSubscriptionForOrganization(organizationId);

  const session = await createPasswordSession(user.id);
  const response = NextResponse.json({ ok: true });
  setAuthSessionCookie(response, request, session.sessionToken, session.expires);

  return response;
}
