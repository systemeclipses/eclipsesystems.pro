"use client";
import styles from './DashboardOverview.module.css';
import Link from 'next/link';

interface Counts { leads: number; prospects: number; clients: number; winRate: number; }
interface ActionItem { title: string; href: string; detail: string; }
interface ProspectJourneyItem { id: string; name: string; stage: string; progress: number; updatedAt: string | null; }
interface RecentActivityItem { id: string; label: string; detail: string; timestamp: string; icon: string; accent: string; }
interface MonthlyStats { newLeads: number; activeDeals: number; wonDeals: number; winRate: number; }
interface RevenueForecast { openVolume: number; targetVolume: number; closeRate: number; }
interface DashboardFollowUpItem {
  id: string;
  opportunityId: string;
  followUpAt: string;
  followUpType: string | null;
  channel: string | null;
  organizationName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}
interface Props {
  counts: Counts;
  actions: ActionItem[];
  prospects: ProspectJourneyItem[];
  activity: RecentActivityItem[];
  monthly: MonthlyStats;
  revenue: RevenueForecast;
  followUps: DashboardFollowUpItem[];
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Suspect',
  prospect: 'Prospect',
  client: 'Client',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'var(--brand-gold)',
  prospect: 'var(--brand-blue-light)',
  client: '#4ade80',
};

const formatStageLabel = (stage: string) => STAGE_LABELS[stage] ?? stage?.replace(/^\w/, (c) => c.toUpperCase()) ?? 'Prospect';

const formatUpdatedAt = (date: string | null) => {
  if (!date) return 'Updated just now';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return 'Recently updated';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
};

const formatFollowUpDate = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFollowUpTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getFollowUpContact = (item: DashboardFollowUpItem) =>
  item.contactName || item.contactEmail || item.contactPhone || 'No contact';

export function DashboardOverview({ counts, actions, prospects, activity, monthly, revenue, followUps }: Props) {

  return (
    <>
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
            <div className={styles.statValue}>{counts.winRate}%</div>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className={styles.widgetGrid}>
        <div className={styles.leftColumn}>
          <div className={`${styles.widget} ${styles.widgetCompact} ${styles.leftWidget}`}>
            <div className={styles.widgetHeader}>
              <h3>Recent Activity</h3>
              <i className="fas fa-clock"></i>
            </div>
            <div className={styles.widgetContent}>
              {activity.length === 0 ? (
                <p className={styles.pipelineEmpty}>No recent activity.</p>
              ) : (
                activity.map((event) => (
                  <div className={styles.activityItem} key={event.id}>
                    <div className={styles.activityIcon} style={{ background: event.accent }}>
                      <i className={event.icon}></i>
                    </div>
                    <div className={styles.activityDetails}>
                      <div className={styles.activityTitle}>{event.label}</div>
                      <div className={styles.activityTime}>{event.detail}</div>
                      <div className={styles.activityTime}>{formatTimeAgo(event.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`${styles.widget} ${styles.leftWidget}`}>
            <div className={styles.widgetHeader}>
              <h3>This Month</h3>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>{monthly.newLeads}</div>
                  <div className={styles.performanceLabel}>New Suspects</div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>{monthly.activeDeals}</div>
                  <div className={styles.performanceLabel}>Active Deals</div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>{monthly.wonDeals}</div>
                  <div className={styles.performanceLabel}>Won Deals</div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceValue}>{monthly.winRate}%</div>
                  <div className={styles.performanceLabel}>Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.middleColumn}>
          <div className={`${styles.widget} ${styles.pipelineWidget}`}>
            <div className={styles.widgetHeader}>
              <h3>Pipeline Overview</h3>
              <i className="fas fa-signal"></i>
            </div>
            <div className={styles.pipelineList}>
              {prospects.length === 0 ? (
                <p className={styles.pipelineEmpty}>No prospects yet. Once you add prospects they will appear here with progress.</p>
              ) : (
                prospects.slice(0, 10).map((prospect) => (
                  <div key={prospect.id} className={styles.pipelineProspect}>
                    <div className={styles.pipelineProspectHeader}>
                      <div>
                        <p className={styles.pipelineProspectName}>{prospect.name}</p>
                        <p className={styles.pipelineProspectMeta}>
                          {formatStageLabel(prospect.stage)} · {formatUpdatedAt(prospect.updatedAt)}
                        </p>
                      </div>
                      <span className={styles.pipelineProspectPercent}>{Math.round(prospect.progress)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${Math.min(100, Math.max(0, prospect.progress))}%`,
                          background: STAGE_COLORS[prospect.stage] ?? 'var(--brand-blue-light)',
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>Quick Actions</h3>
              <i className="fas fa-bolt"></i>
            </div>
            <div className={styles.widgetContent} style={{ gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {actions.slice(0, 4).map((action) => {
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

          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>Revenue Forecast</h3>
              <i className="fas fa-chart-line"></i>
            </div>
            <div className={styles.widgetContent}>
              <div className={styles.progressBar} style={{ height: '16px' }}>
                <div
                  className={styles.progressFill}
                  style={{
                    width:
                      revenue.targetVolume === 0 ? '0%' : `${Math.min(100, Math.round((revenue.openVolume / revenue.targetVolume) * 100))}%`,
                    background: 'var(--brand-gold)',
                  }}
                ></div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  color: '#a8b5c7',
                }}
              >
                <span>Open pipeline</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>${revenue.openVolume.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 600, color: '#fff' }}>${revenue.targetVolume.toLocaleString()}</div>
              <p style={{ margin: 0, fontSize: '12px', color: '#a8b5c7' }}>
                Weighted pipeline vs. closed revenue · Close rate {revenue.closeRate}%
              </p>
            </div>
          </div>

          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h3>Followups</h3>
              <i className="fas fa-list-check"></i>
            </div>
            {followUps.length === 0 ? (
              <p className={styles.followUpEmpty}>
                You are all caught up. No follow-ups scheduled this week.
              </p>
            ) : (
              <div className={styles.followUpTableWrap}>
                <table className={styles.followUpTable}>
                  <thead>
                    <tr>
                      <th>Due</th>
                      <th>Organization</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followUps.map((item) => {
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className={styles.followUpDate}>{formatFollowUpDate(item.followUpAt)}</div>
                            <div className={styles.followUpMeta}>{formatFollowUpTime(item.followUpAt)}</div>
                          </td>
                          <td>{item.organizationName ?? '-'}</td>
                          <td>{getFollowUpContact(item)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Link href="/gf1/activity" className={styles.followUpLink}>
              View all follow-ups
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
