import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { ensureTrialSubscriptionForOrganization } from "@/src/db/queries/billing";

export const runtime = "nodejs";

export async function POST() {
  await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  await ensureTrialSubscriptionForOrganization(organizationId);

  return NextResponse.json({ ok: true });
}
