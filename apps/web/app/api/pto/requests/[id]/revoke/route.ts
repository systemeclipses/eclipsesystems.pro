import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { transitionPtoRequest } from "@/src/db/queries/pto-workflow";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  if (!actorMembershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  try {
    const result = await transitionPtoRequest(params.id, "REVOKE", {
      note: typeof body.note === "string" ? body.note : null,
      reason: typeof body.reason === "string" ? body.reason : null
    }, { organizationId, actorMembershipId });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to revoke request." }, { status: 400 });
  }
}
