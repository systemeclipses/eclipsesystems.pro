import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { supaServer } from '@/lib/supabase/server';
import { isUserApproved, parseAdminEmails } from '@/lib/auth';
import { resolveProfileRole } from '@/lib/gf1/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supaServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('[auth] getUser error in ProtectedLayout:', error.message);
  }
  if (!user) {
    console.info('[auth] No user in ProtectedLayout, redirecting to /signin');
    redirect('/signin');
  }

  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (!isUserApproved(user, adminEmails)) {
    redirect('/awaiting-approval');
  }

  const role = await resolveProfileRole(user);
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname');
  if (role === 'letter_generator' && pathname && !pathname.startsWith('/generators/letter')) {
    redirect('/generators/letter');
  }
  // Implementations users keep the standard intranet (Dashboard, Documents,
  // Academy, Support, Generators, Implementations) but are blocked from GF1
  // and the admin area.
  if (role === 'implementations' && pathname) {
    const blocked = pathname.startsWith('/gf1') || pathname.startsWith('/admin');
    if (blocked) {
      redirect('/implementations');
    }
  }

  return <>{children}</>;
}
