import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getDefaultOrganizationForUser, getMembershipIdForUser } from "@/src/db/queries/organizations";
import { transitionShift } from "@/src/db/queries/shift-state-machine";
import { stopTimerForUser } from "@/src/db/queries/time-entries";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await getDefaultOrganizationForUser(userId);
  if (!organizationId) return NextResponse.json({ error: "Workspace required" }, { status: 400 });
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const entryId = typeof body.id === "string" ? body.id : null;
  const location = typeof body.location === "object" && body.location ? body.location : null;
  const deviceInfo = {
    userAgent: request.headers.get("user-agent"),
    platform: typeof body.platform === "string" ? body.platform : null,
    offline: Boolean(body.offline)
  };

  try {
    const result = await transitionShift("CLOCK_OUT", {
      userId,
      organizationId,
      membershipId,
      requestId: typeof body.requestId === "string" ? body.requestId : null,
      note: typeof body.note === "string" ? body.note : null,
      location,
      deviceInfo
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to clock out.";
    if (entryId && (message.includes("Cannot CLOCK_OUT when shift is in state CLOCKED_OUT") || message === "no_active_shift")) {
      await stopTimerForUser({
        userId,
        organizationId,
        membershipId,
        entryId,
        punchNote: typeof body.note === "string" ? body.note : null,
        location,
        deviceInfo
      });
      return NextResponse.json({ ok: true, state: "CLOCKED_OUT", time_entry_id: entryId, reconciled: true });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to clock out." }, { status: 400 });
  }
}
