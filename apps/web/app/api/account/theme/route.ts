import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { profiles } from "@/src/db/schema";

export const runtime = "nodejs";

const preferences = new Set(["light", "dark", "system"]);

function isThemePreference(value: unknown): value is "light" | "dark" | "system" {
  return typeof value === "string" && preferences.has(value);
}

export async function GET() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db
    .select({ themePreference: profiles.themePreference })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return NextResponse.json({ preference: profile?.themePreference ?? "light" });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { preference?: unknown } | null;
  if (!isThemePreference(body?.preference)) {
    return NextResponse.json({ error: "Choose light, dark, or system." }, { status: 400 });
  }

  await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email ?? `${user.id}@eclipsesystems.local`,
      fullName: user.name ?? null,
      displayName: user.name ?? user.email?.split("@")[0] ?? "Eclipse user",
      avatarUrl: user.image ?? null,
      themePreference: body.preference,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        themePreference: body.preference,
        updatedAt: new Date()
      }
    });

  return NextResponse.json({ ok: true, preference: body.preference });
}
