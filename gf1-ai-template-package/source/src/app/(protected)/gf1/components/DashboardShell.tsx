"use client";
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './DashboardShell.module.css';
import type { ProfileRole } from '@/lib/gf1/types';

interface Props {
  children: ReactNode;
  role?: ProfileRole | null;
}

export function DashboardShell({ children, role }: Props) {
  const pathname = usePathname();

  type NavLink = { label: string; href: string; icon: string; beta?: boolean };

  const isAdmin = role === 'admin';

  const navLinks: NavLink[] = [
    { label: 'Dashboard', href: '/gf1', icon: 'fas fa-home' },
    { label: 'Opportunities', href: '/gf1/opportunities', icon: 'fas fa-briefcase' },
    { label: 'Activity', href: '/gf1/activity', icon: 'fas fa-list-check' },
    { label: 'Organizations', href: '/gf1/organizations', icon: 'fas fa-building' },
    { label: 'Pipeline', href: '/gf1/pipeline', icon: 'fas fa-signal' },
    { label: 'Proposals', href: '/gf1/proposals', icon: 'fas fa-file-alt' },
    { label: 'Pricing', href: '/gf1/pricing', icon: 'fas fa-file-signature' },
    { label: 'Renewals', href: '/gf1/renewals', icon: 'fas fa-rotate' },
    { label: 'Reports', href: '/gf1/reports', icon: 'fas fa-chart-line' },
    { label: 'Support', href: '/gf1/support', icon: 'fas fa-headset' },
    ...(isAdmin
      ? [{ label: 'Settings', href: '/gf1/admin/settings', icon: 'fas fa-gear' } as NavLink]
      : []),
  ];

  return (
    <div className={styles.container} data-gf1-dashboard="true">
      {/* Sidebar Navigation */}
      <nav className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.5rem', marginTop: '-3px', position: 'relative', left: '2px' }}></i>
            <span>GALFORCE</span>
          </div>
        </div>
        <ul className={styles.navList}>
          {navLinks.map(link => (
            <li key={link.href} className={pathname === link.href ? styles.active : ''}>
              <Link href={link.href}>
                <i className={link.icon}></i>
                <span>
                  {link.label}
                  {link.beta && (
                    <span
                      style={{
                        marginLeft: '6px',
                        fontSize: '9px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: 'rgba(24,119,242,0.18)',
                        color: '#e5edff',
                        border: '1px solid rgba(118,196,255,0.6)',
                      }}
                    >
                      Beta
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}

