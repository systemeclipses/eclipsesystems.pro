import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getDefaultOrganizationForUser } from "@/src/db/queries/organizations";
import { stopTimerForUser } from "@/src/db/queries/time-entries";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await getDefaultOrganizationForUser(userId);
  if (!organizationId) return NextResponse.json({ error: "Workspace required" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== "string") return NextResponse.json({ error: "Timer id required" }, { status: 400 });

  await stopTimerForUser(userId, organizationId, body.id);

  return NextResponse.json({ ok: true });
}
