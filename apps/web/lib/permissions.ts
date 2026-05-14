export type MemberRole = "owner" | "admin" | "manager" | "member";

const roleRank: Record<MemberRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  member: 1
};

export function hasRoleAtLeast(actual: MemberRole, required: MemberRole) {
  return roleRank[actual] >= roleRank[required];
}
