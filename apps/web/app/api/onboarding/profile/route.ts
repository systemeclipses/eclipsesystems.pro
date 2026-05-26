import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { profiles } from "@/src/db/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 160) : "";
  const preferredName = typeof body.preferredName === "string" ? body.preferredName.trim().slice(0, 80) : "";

  await db
    .update(profiles)
    .set({
      fullName: fullName || null,
      displayName: preferredName || fullName || null,
      updatedAt: new Date()
    })
    .where(eq(profiles.id, session.user.id));

  return NextResponse.json({ ok: true });
}
