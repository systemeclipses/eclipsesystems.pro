import './globals.css';
import Header from '@/components/Header';
import { supaServer } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { isUserApproved, parseAdminEmails } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Galactic 365',
  description: 'Internal operations hub for Galactic, Inc.',
  icons: {
    icon: '/g365icon.svg',
    shortcut: '/g365icon.svg',
    apple: '/g365icon.svg',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supaServer();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  const approved = isUserApproved(user, adminEmails);
  let profileName: string | null = null;
  let profileRole: string | null = null;

  if (user?.id) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('user_id', user.id)
        .maybeSingle();
      const profileRow = data as { name?: string | null; role?: string | null } | null;
      profileName = profileRow?.name ?? null;
      profileRole = profileRow?.role ?? null;
    } catch (err) {
      console.error('Failed to load profile name for header', err);
    }
  }

  const metadata = (user?.user_metadata as any) ?? {};
  const headerUser = {
    email: user?.email ?? null,
    fullName: profileName ?? metadata?.full_name ?? null,
    approved,
    role: profileRole ?? null,
    profileImage: metadata?.profile_image ?? null,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <script src="https://cdn.brevo.com/js/sdk-loader.js" async />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Version: 2.0
              window.Brevo = window.Brevo || [];
              Brevo.push([
                "init",
                {
                  client_key: "zvdz623m9gzthbyog6qqz3u0"
                }
              ]);
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="layout-shell">
        <Header user={headerUser} />
        <main className="site-main">
          <div className="site-container space-stack">
            {children}
          </div>
        </main>
        <footer className="footer">
          © {new Date().getFullYear()} Galactic Projects Team · Powering operations across the fleet.
        </footer>
      </body>
    </html>
  );
}
