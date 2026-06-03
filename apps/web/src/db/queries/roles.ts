import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/src/db";
import { membershipProductRoles, memberships, permissionCustomGroups, permissionRoles, profiles } from "@/src/db/schema";

export async function getRolesOverview(organizationId: string) {
  const [memberRows, customRoleRows, customGroupRows, productAccessRows] = await Promise.all([
    db
      .select({
        id: memberships.id,
        role: memberships.role,
        department: memberships.department,
        managerMembershipId: memberships.managerMembershipId,
        email: profiles.email,
        fullName: profiles.fullName
      })
      .from(memberships)
      .innerJoin(profiles, eq(profiles.id, memberships.userId))
      .where(and(eq(memberships.organizationId, organizationId), isNull(memberships.deletedAt))),
    db
      .select({
        id: permissionRoles.id,
        roleKey: permissionRoles.roleKey,
        name: permissionRoles.name,
        description: permissionRoles.description,
        kind: permissionRoles.kind,
        baseRole: permissionRoles.baseRole,
        defaultScopeType: permissionRoles.defaultScopeType
      })
      .from(permissionRoles)
      .where(and(eq(permissionRoles.organizationId, organizationId), isNull(permissionRoles.deletedAt))),
    db
      .select({
        id: permissionCustomGroups.id,
        name: permissionCustomGroups.name,
        description: permissionCustomGroups.description
      })
      .from(permissionCustomGroups)
      .where(and(eq(permissionCustomGroups.organizationId, organizationId), isNull(permissionCustomGroups.deletedAt))),
    db
      .select({
        membershipId: membershipProductRoles.membershipId,
        product: membershipProductRoles.product,
        accessRole: membershipProductRoles.accessRole
      })
      .from(membershipProductRoles)
      .where(and(eq(membershipProductRoles.organizationId, organizationId), isNull(membershipProductRoles.revokedAt)))
  ]);

  const counts = memberRows.reduce<Record<string, number>>((acc, member) => {
    acc[member.role] = (acc[member.role] ?? 0) + 1;
    return acc;
  }, {});

  return {
    members: memberRows,
    roleCounts: counts,
    productAccess: productAccessRows,
    customRoles: customRoleRows.filter((role) => role.kind === "custom"),
    customGroups: customGroupRows
  };
}
