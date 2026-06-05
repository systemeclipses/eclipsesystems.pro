"use client";
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Gf1LayoutClientProps = {
  children: ReactNode;
  user: unknown;
  role: string | null;
};

export default function Gf1LayoutClient({ children }: Gf1LayoutClientProps) {
  const pathname = usePathname();
  
  // Dashboard shell pages (dashboard, opportunities, organizations, pipeline, proposals, reports) have their own complete layout
  const isDashboardShellPage = pathname === '/gf1' ||
                                pathname?.startsWith('/gf1/opportunities') ||
                                pathname?.startsWith('/gf1/organizations') ||
                                pathname?.startsWith('/gf1/activity') ||
                                pathname?.startsWith('/gf1/pipeline') ||
                                pathname?.startsWith('/gf1/renewals') ||
                                pathname?.startsWith('/gf1/proposals') ||
                                pathname?.startsWith('/gf1/pricing') ||
                                pathname?.startsWith('/gf1/reports') ||
                                pathname?.startsWith('/gf1/support');
  
  if (isDashboardShellPage) {
    return <>{children}</>;
  }
  
  // For other pages (leads/new, lead detail, etc.), apply dark wrapper
  return (
    <div style={{
      background: 'var(--brand-navy, #0b2239)',
      minHeight: '100vh',
      color: 'white',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {children}
      </div>
    </div>
  );
}
