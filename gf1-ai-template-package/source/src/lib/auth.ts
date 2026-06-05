export type BasicUser = {
  email?: string | null;
  user_metadata?: Record<string, any> | null;
};

export function parseAdminEmails(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined, adminEmails: string[]): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}

export function isUserApproved(user: BasicUser | null | undefined, adminEmails: string[]): boolean {
  if (!user) return false;
  const approved = Boolean((user.user_metadata as any)?.approved);
  if (approved) return true;
  return isAdminEmail(user.email ?? null, adminEmails);
}
