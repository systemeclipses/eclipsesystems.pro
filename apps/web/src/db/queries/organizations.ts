import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { memberships, organizations, profiles } from "@/src/db/schema";

export async function getDefaultOrganizationForUser(userId: string) {
  const [profile] = await db
    .select({ defaultOrganizationId: profiles.defaultOrganizationId })
    .from(profiles)
    .where(and(eq(profiles.id, userId), isNull(profiles.deletedAt)))
    .limit(1);

  return profile?.defaultOrganizationId ?? null;
}

export async function getMembershipIdForUser(userId: string, organizationId: string) {
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, organizationId),
        isNull(memberships.deletedAt)
      )
    )
    .limit(1);

  return membership?.id ?? null;
}

export async function ensurePersonalOrganizationForUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const existingOrgId = await getDefaultOrganizationForUser(user.id);
  if (existingOrgId) return existingOrgId;

  const displayName = user.name ?? user.email?.split("@")[0] ?? "Personal";

  await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email ?? `${user.id}@eclipsesystems.local`,
      fullName: user.name ?? null,
      displayName,
      avatarUrl: user.image ?? null
    })
    .onConflictDoNothing();

  const [org] = await db
    .insert(organizations)
    .values({
      kind: "personal",
      name: "Personal",
      ownerId: user.id
    })
    .returning({ id: organizations.id });

  const organizationId = org.id;

  await db.insert(memberships).values({
    organizationId,
    userId: user.id,
    role: "owner",
    acceptedAt: new Date(),
    status: "active"
  });

  await db
    .update(profiles)
    .set({ defaultOrganizationId: organizationId })
    .where(eq(profiles.id, user.id));

  return organizationId;
}
