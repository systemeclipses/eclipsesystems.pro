import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { transitionShift } from "@/src/db/queries/shift-state-machine";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  try {
    const result = await transitionShift("START_BREAK", {
      userId,
      organizationId,
      membershipId,
      requestId: typeof body.requestId === "string" ? body.requestId : null,
      note: typeof body.note === "string" ? body.note : null,
      deviceInfo: { userAgent: request.headers.get("user-agent"), platform: typeof body.platform === "string" ? body.platform : null, offline: Boolean(body.offline) }
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start break." }, { status: 400 });
  }
}
