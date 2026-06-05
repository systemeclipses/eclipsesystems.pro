"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supaClient } from '@/lib/supabase/client';
import MainNavGF1Dropdown from '../app/components/MainNavGF1Dropdown';
import styles from '../app/components/MainNavGF1Dropdown.module.css';

type HeaderUser = {
  email: string | null;
  fullName: string | null;
  approved: boolean;
  role?: string | null;
  profileImage?: string | null;
};

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', requiresAuth: true },
  { href: '/documents', label: 'Documents', requiresAuth: true },
  { href: '/academy', label: 'Academy', requiresAuth: true },
  { href: '/support', label: 'Support', requiresAuth: true },
  { href: '/generators', label: 'Generators', requiresAuth: true },
  { href: '/gf1', label: 'GF1', requiresAuth: true },
];

export default function Header({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<HeaderUser>(user);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const supabase = supaClient();

    const resolveProfile = async (userId: string | null | undefined) => {
      if (!userId) return null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('user_id', userId)
          .maybeSingle();
        const row = data as { name?: string | null; role?: string | null } | null;
        return { name: row?.name ?? null, role: row?.role ?? null };
      } catch {
        return null;
      }
    };

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        const current = data?.user ?? null;
        const profileData = await resolveProfile(current?.id ?? null);
        if (!mounted) return;
        setProfile({
          email: current?.email ?? null,
          fullName: profileData?.name ?? (current?.user_metadata as any)?.full_name ?? null,
          approved: Boolean((current?.user_metadata as any)?.approved),
          role: profileData?.role ?? null,
          profileImage: (current?.user_metadata as any)?.profile_image ?? null,
        });
      } catch {
        // ignore fetch failures
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!mounted) return;
        const current = session?.user ?? null;
        const profileData = await resolveProfile(current?.id ?? null);
        if (!mounted) return;
        setProfile({
          email: current?.email ?? null,
          fullName: profileData?.name ?? (current?.user_metadata as any)?.full_name ?? null,
          approved: Boolean((current?.user_metadata as any)?.approved),
          role: profileData?.role ?? null,
          profileImage: (current?.user_metadata as any)?.profile_image ?? null,
        });
      })();
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe();
      } catch {
        // ignore unsubscribe errors
      }
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const visibleLinks = useMemo(() => {
    const isAdmin = profile.role === 'admin';
    const isLetterOnly = profile.role === 'letter_generator';
    const isImplementations = profile.role === 'implementations';
    if (isLetterOnly) {
      return [{ href: '/generators/letter', label: 'Letter Generator', requiresAuth: true }];
    }

    const gf1AllowedRoles = new Set(['admin', 'sales', 'sales_manager']);
    const base = NAV_LINKS
      .filter((link) => (link.requiresAuth ? Boolean(profile.email) : true))
      .filter((link) => (link.href.startsWith('/gf1') ? gf1AllowedRoles.has(profile.role ?? '') : true));

    if (isImplementations) {
      // Same intranet links as everyone else (already filtered to drop GF1
      // since the role isn't in gf1AllowedRoles), plus the Implementations
      // link. No Admin.
      return [
        ...base,
        { href: '/implementations', label: 'Implementations', requiresAuth: true },
      ];
    }

    if (isAdmin) {
      return [...base, { href: '/admin', label: 'Admin', requiresAuth: true }];
    }
    return base;
  }, [profile.email, profile.role]);

  const initials = useMemo(() => {
    if (profile.fullName) {
      return profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
    }
    return profile.email?.[0]?.toUpperCase() ?? 'G';
  }, [profile.fullName, profile.email]);

  async function handleSignOut() {
    try {
      const supabase = supaClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('client signOut failed', e);
    }

    try {
      await fetch('/api/auth', { method: 'DELETE', credentials: 'include' });
    } catch (e) {
      console.error('failed to clear server session', e);
    }

    router.replace('/signin');
    router.refresh();
  }

  if (
    pathname.startsWith('/gf1/intake/') ||
    pathname.startsWith('/gf1/retirement-questionnaire') ||
    pathname.startsWith('/sign/agreements/')
  )
    return null;

  return (
    <header className="site-header" data-role={profile.role ?? 'unknown'}>
      <div className="site-container header-bar">
        <Link href="/" className="brand brand-with-logo" aria-label="Galactic 365 home">
          <Image
            src="/g365.svg"
            alt="Galactic 365"
            width={136}
            height={69}
            className="brand-logo"
            priority
          />
        </Link>

        {visibleLinks.length > 0 && (
          <nav className="primary-nav" aria-label="Primary">
            {visibleLinks.map((link) =>
              link.label === 'GF1' ? (
                <Link 
                  key="gf1-link" 
                  href="/gf1"
                  className="nav-link"
                  data-active={pathname.startsWith('/gf1')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem',
                    fontWeight: 700
                  }}
                >
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1rem', marginTop: '-2.5px', position: 'relative', left: '2px' }}></i>
                  <span>GALFORCE</span>
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                  data-active={pathname === link.href}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        )}

        <div className="header-actions">
          {profile.email ? (
            <div className="profile-actions">
              <button
                type="button"
                className="ghost-button profile-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={open}
              >
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span className="avatar-badge">{initials}</span>
                )}
                <span className="profile-name">{profile.fullName ?? profile.email}</span>
              </button>
              {open && (
                <div className="dropdown">
                  <div>
                    <div className="subtle">Signed in as</div>
                    <strong className="profile-email">{profile.email}</strong>
                  </div>
                  {profile.role !== 'letter_generator' && (
                    <Link href="/profile" className="ghost-button">
                      Profile
                    </Link>
                  )}
                  <button type="button" onClick={handleSignOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin" className="ghost-button">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
