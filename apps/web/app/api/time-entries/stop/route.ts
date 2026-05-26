import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getDefaultOrganizationForUser, getMembershipIdForUser } from "@/src/db/queries/organizations";
import { transitionShift } from "@/src/db/queries/shift-state-machine";

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
    const result = await transitionShift("CLOCK_OUT", {
      userId,
      organizationId,
      membershipId,
      requestId: typeof body.requestId === "string" ? body.requestId : null,
      note: typeof body.note === "string" ? body.note : null,
      location: typeof body.location === "object" && body.location ? body.location : null,
      deviceInfo: {
        userAgent: request.headers.get("user-agent"),
        platform: typeof body.platform === "string" ? body.platform : null,
        offline: Boolean(body.offline)
      }
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to clock out." }, { status: 400 });
  }
}
