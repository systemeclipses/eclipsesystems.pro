import { NextResponse } from "next/server";
import { getActiveOrgId, getAuthenticatedUserId } from "@/lib/org";
import { getMembershipIdForUser } from "@/src/db/queries/organizations";
import { createPtoRequest } from "@/src/db/queries/timekeeping";
import { normalizePtoRequestForCreate, validatePtoRequest } from "@/src/db/queries/pto-validation";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  const organizationId = await getActiveOrgId();
  const membershipId = await getMembershipIdForUser(userId, organizationId);
  if (!membershipId) return NextResponse.json({ error: "Membership required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const validation = await validatePtoRequest(body, { organizationId, membershipId });
  if (!validation.valid) return NextResponse.json({ error: "validation_failed", validation }, { status: 400 });

  const acknowledgedWarnings = Array.isArray(body.acknowledgeWarnings)
    ? body.acknowledgeWarnings
    : Array.isArray(body.acknowledge_warnings)
      ? body.acknowledge_warnings
      : [];
  const unacknowledged = validation.warnings.filter((warning) => warning.overridable && !acknowledgedWarnings.includes(warning.code));
  if (unacknowledged.length) return NextResponse.json({ error: "warnings_not_acknowledged", warnings: unacknowledged, validation }, { status: 400 });

  try {
    const normalized = normalizePtoRequestForCreate(body);
    const ptoRequest = await createPtoRequest({
      organizationId,
      membershipId,
      categoryId: normalized.categoryId,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      hours: validation.computed.hours_requested.toFixed(2),
      employeeNote: normalized.employeeNote,
      validation,
      acknowledgedWarnings
    });

    return NextResponse.json(ptoRequest);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit PTO request." }, { status: 500 });
  }
}
