import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/src/auth";
import { hashPassword, validatePassword, verifyPassword } from "@/src/auth-password";
import { db } from "@/src/db";
import { passwordCredentials } from "@/src/db/schema";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } | null;

  const currentPassword = body?.currentPassword ?? "";
  const newPassword = body?.newPassword ?? "";
  const confirmPassword = body?.confirmPassword ?? "";

  const passwordError = validatePassword(newPassword);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const [existing] = await db
    .select({
      userId: passwordCredentials.userId,
      passwordHash: passwordCredentials.passwordHash,
      passwordSalt: passwordCredentials.passwordSalt
    })
    .from(passwordCredentials)
    .where(eq(passwordCredentials.userId, userId))
    .limit(1);

  if (existing) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
    }

    const currentIsValid = await verifyPassword(currentPassword, existing.passwordHash, existing.passwordSalt);
    if (!currentIsValid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
  }

  const credential = await hashPassword(newPassword);

  await db
    .insert(passwordCredentials)
    .values({
      userId,
      ...credential,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: passwordCredentials.userId,
      set: {
        ...credential,
        updatedAt: new Date()
      }
    });

  return NextResponse.json({ ok: true });
}
