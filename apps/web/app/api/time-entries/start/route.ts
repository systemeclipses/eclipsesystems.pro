import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getDefaultOrganizationForUser, getMembershipIdForUser } from "@/src/db/queries/organizations";
import { transitionShift } from "@/src/db/queries/shift-state-machine";
import { reconcileStaleRunningTimeEntries } from "@/src/db/queries/time-entries";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = await getDefaultOrganizationForUser(userId);
  if (!organizationId) return NextResponse.json({ error: "Workspace required" }, { status: 400 });

  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  try {
    await reconcileStaleRunningTimeEntries({ organizationId, membershipId });
    const result = await transitionShift("CLOCK_IN", {
      userId,
      organizationId,
      membershipId,
      requestId: typeof body.requestId === "string" ? body.requestId : null,
      note: typeof body.note === "string" ? body.note : typeof body.description === "string" ? body.description : null,
      location: typeof body.location === "object" && body.location ? body.location : null,
      deviceInfo: {
        userAgent: request.headers.get("user-agent"),
        platform: typeof body.platform === "string" ? body.platform : null,
        offline: Boolean(body.offline)
      }
    });

    return NextResponse.json({
      id: result.time_entry_id,
      punch_id: result.punch_id,
      shift_id: result.shift_id,
      current_state: result.state,
      flags: result.flags,
      started_at: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to clock in." }, { status: 400 });
  }
}
