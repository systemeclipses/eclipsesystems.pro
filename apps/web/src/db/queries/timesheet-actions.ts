import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { auditLog, memberships } from "@/src/db/schema";

export async function auditTimesheetAction(input: {
  organizationId: string;
  actorUserId: string;
  targetMembershipId: string;
  action: "submit" | "approve" | "send_back" | "lock" | "unlock";
  note?: string | null;
}) {
  const [actor] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, input.actorUserId))
    .limit(1);

  await db.insert(auditLog).values({
    organizationId: input.organizationId,
    actorMembershipId: actor?.id ?? null,
    action: `timesheet.${input.action}`,
    targetType: "membership",
    targetId: input.targetMembershipId,
    after: { status: input.action },
    reason: input.note || null
  });
}
