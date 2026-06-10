import { sql } from "drizzle-orm";
import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { ensurePersonalOrganizationForUser, getDefaultOrganizationForUser, getMembershipIdForUser } from "@/src/db/queries/organizations";
import { memberships } from "@/src/db/schema";
import { eq } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ServerDbSession = {
  userId: string;
  organizationId: string;
  membershipId: string | null;
  role: string | null;
};

export async function withServerDb<T>(handler: (tx: Tx, session: ServerDbSession) => Promise<T>) {
  const session = await auth();
  const user = session?.user;
  const userId = user?.id;

  if (!userId) throw new Error("Authentication required.");

  const organizationId = await getDefaultOrganizationForUser(userId)
    ?? await ensurePersonalOrganizationForUser({
      id: userId,
      email: user.email,
      name: user.name,
      image: user.image
    });
  const membershipId = await getMembershipIdForUser(userId, organizationId);

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_profile', ${userId}, false)`);
    await tx.execute(sql`select set_config('app.current_org', ${organizationId}, false)`);

    const [membership] = membershipId
      ? await tx.select({ role: memberships.role }).from(memberships).where(eq(memberships.id, membershipId)).limit(1)
      : [];

    return handler(tx, {
      userId,
      organizationId,
      membershipId,
      role: membership?.role ?? null
    });
  });
}
