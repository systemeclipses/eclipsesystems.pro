import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { approveFinalPay } from "@/src/db/queries/offboarding";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const actorMembershipId = await getMembershipIdForUser(userId, organizationId);
  await approveFinalPay({ organizationId, offboardingId: params.id, actorMembershipId });
  return NextResponse.json({ ok: true });
}
