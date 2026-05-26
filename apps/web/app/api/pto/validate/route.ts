import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { validatePtoRequest } from "@/src/db/queries/pto-validation";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const validation = await validatePtoRequest(body, { organizationId, membershipId });
  return NextResponse.json(validation);
}
