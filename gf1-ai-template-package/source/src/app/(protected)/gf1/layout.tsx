import type { ReactNode } from 'react';

export default async function Gf1Layout({ children }: { children: ReactNode }) {
  const { requireGf1Access } = await import('@/lib/gf1/auth');
  const { default: Gf1LayoutClient } = await import('./Gf1LayoutClient');
  const { user, role } = await requireGf1Access();
  return <Gf1LayoutClient user={user} role={role}>{children}</Gf1LayoutClient>;
}
