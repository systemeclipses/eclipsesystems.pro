"use client";
import Head from 'next/head';
import styles from './NewDashboard.module.css';
import Link from 'next/link';

interface Counts { leads: number; prospects: number; clients: number; }
interface ActionItem { title: string; href: string; detail: string; }
interface Props { counts: Counts; actions: ActionItem[]; role: string | null; }

export function NewDashboard({ counts, actions, role }: Props) {
  const navLinks = [
    { label: 'Dashboard', href: '/gf1', icon: 'fas fa-home' },
    { label: 'Pipeline', href: '/gf1/pipeline', icon: 'fas fa-signal' },
    { label: 'Opportunities', href: '/gf1/opportunities', icon: 'fas fa-briefcase' },
    { label: 'Activity', href: '/gf1/activity', icon: 'fas fa-list-check' },
    { label: 'Organizations', href: '/gf1/organizations', icon: 'fas fa-building' },
    { label: 'Proposals', href: '/gf1/proposals', icon: 'fas fa-file-alt' },
    { label: 'Reports', href: '/gf1/reports/win-loss', icon: 'fas fa-chart-line' },
  ];

  return (
    <div className="gf1-dashboard-wrapper">
      <div className={styles.container}>
        <Head>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        </Head>
        
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
            <li key={link.href} className={link.href === '/gf1' ? styles.active : ''}>
              <Link href={link.href}>
                <i className={link.icon}></i>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{color: 'var(--brand-gold)'}}>
              <i className="fas fa-users"></i>
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Total Suspects</div>
              <div className={styles.statValue}>{counts.leads}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{color: 'var(--brand-blue-light)'}}>
              <i className="fas fa-handshake"></i>
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Prospects</div>
              <div className={styles.statValue}>{counts.prospects}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{color: 'var(--brand-blue)'}}>
              <i className="fas fa-building"></i>
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Active Clients</div>
              <div className={styles.statValue}>{counts.clients}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{color: '#4ade80'}}>
              <i className="fas fa-trophy"></i>
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Win Rate</div>
              <div className={styles.statValue}>78%</div>
            </div>
          </div>
        </div>

        {/* Widgets Grid */}
        <div className={styles.widgetGrid}>
          {/* Recent Activity Widget */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>Recent Activity</h3>
              <i className="fas fa-clock"></i>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon} style={{background: 'var(--brand-blue)'}}>
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className={styles.activityDetails}>
                  <div className={styles.activityTitle}>New suspect added</div>
                  <div className={styles.activityTime}>2 hours ago</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon} style={{background: 'var(--brand-gold)'}}>
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className={styles.activityDetails}>
                  <div className={styles.activityTitle}>Proposal created</div>
                  <div className={styles.activityTime}>5 hours ago</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon} style={{background: '#4ade80'}}>
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className={styles.activityDetails}>
                  <div className={styles.activityTitle}>Deal closed</div>
                  <div className={styles.activityTime}>1 day ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Widget */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>Quick Actions</h3>
              <i className="fas fa-bolt"></i>
            </div>
            <div className={styles.widgetContent}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px'}}>
                {actions.slice(0, 4).map(action => {
                  let iconClass = 'fas fa-plus-circle';
                  if (action.href === '/gf1/pipeline') iconClass = 'fas fa-signal';
                  else if (action.href === '/gf1/organizations') iconClass = 'fas fa-building';
                  else if (action.href.includes('/proposals')) iconClass = 'fas fa-file-alt';
                  
                  return (
                    <Link key={action.href} href={action.href} className={styles.actionButton}>
                      <i className={iconClass}></i>
                      <span>{action.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pipeline Overview Widget */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>Pipeline Overview</h3>
              <i className="fas fa-signal"></i>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.pipelineItem}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>Suspects</span>
                  <span style={{fontSize: '14px', fontWeight: '600', color: 'var(--brand-blue-light)'}}>65%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{width: '65%', background: 'var(--brand-blue-light)'}}></div>
                </div>
              </div>
              <div className={styles.pipelineItem}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>In Progress</span>
                  <span style={{fontSize: '14px', fontWeight: '600', color: 'var(--brand-gold)'}}>45%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{width: '45%', background: 'var(--brand-gold)'}}></div>
                </div>
              </div>
              <div className={styles.pipelineItem}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>Closed</span>
                  <span style={{fontSize: '14px', fontWeight: '600', color: '#4ade80'}}>80%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{width: '80%', background: '#4ade80'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Widget */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>This Month</h3>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>24</div>
                  <div className={styles.performanceLabel}>New Suspects</div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>12</div>
                  <div className={styles.performanceLabel}>Active Deals</div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>7</div>
                  <div className={styles.performanceLabel}>Won Deals</div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>78%</div>
                  <div className={styles.performanceLabel}>Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

