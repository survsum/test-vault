import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingState, ErrorState } from '../components/Feedback';
import Badge from '../components/Badge';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowUpRight,
  ShieldAlert,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Briefcase
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/dashboard/stats')
      .then(({ data }) => active && setStats(data.data))
      .catch(() => active && setError('Could not load dashboard data from backend server.'));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <LoadingState label="Loading evidence vault overview…" />;

  const maxMonthly = Math.max(1, ...stats.monthlyEvidence.map((m) => m.count));

  // Today's formatted date string e.g. 24 SEPTEMBER 2026
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Editorial Header Block */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <span className="meta-label">OVERVIEW</span>
            <h1 className="display-heading">Digital evidence vault</h1>
            <p className="display-subtext">A quiet overview of your active investigations and evidence custody.</p>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', paddingTop: 6 }}>
            {dateStr}
          </div>
        </div>
      </Reveal>

      <div className="editorial-divider" />

      {/* Metrics Row: Enormous Typography & Thin Separators */}
      <Reveal delay={100}>
        <div className="stats-grid">
          <StatCard label="TOTAL CASES" value={stats.totalCases} subtitle={`${stats.openCases} Open · ${stats.closedCases} Closed`} />
          <StatCard label="ACTIVE EVIDENCE" value={stats.totalEvidence} subtitle={`${stats.approvedEvidence} Verified`} />
          <StatCard label="PENDING REVIEW" value={stats.pendingEvidence} subtitle="Awaiting Supervisor Clearance" />
          <StatCard label="SECURITY ALERTS" value={stats.unreadNotifications} subtitle="Unread Alerts" />
        </div>
      </Reveal>

      <div className="editorial-divider" />

      {/* Secondary Quick Metrics */}
      <Reveal delay={150}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 40 }}>
          <div style={{ borderLeft: '1px solid var(--panel-border)', paddingLeft: 16 }}>
            <span className="meta-label">APPROVED ITEMS</span>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 300, color: '#fff', marginTop: 4 }}>{stats.approvedEvidence}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--panel-border)', paddingLeft: 16 }}>
            <span className="meta-label">REJECTED ITEMS</span>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 300, color: '#fff', marginTop: 4 }}>{stats.rejectedEvidence}</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--panel-border)', paddingLeft: 16 }}>
            <span className="meta-label">ACTIVE INVESTIGATIONS</span>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 300, color: '#fff', marginTop: 4 }}>{stats.openCases}</div>
          </div>
        </div>
      </Reveal>

      {/* Two Column Layout: Timeline & Uploads */}
      <div className="two-col" style={{ marginTop: 32 }}>
        {/* Left: Recent Evidence Table */}
        <Reveal delay={200}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <span className="meta-label">RECENT EVIDENCE</span>
                  <h3 className="section-title">Forensic registry activity</h3>
                </div>
                <Link to="/evidence" style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View Registry <ArrowUpRight size={14} />
                </Link>
              </div>

              {stats.recentUploads.length === 0 && <p className="muted">No recent evidence records.</p>}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {stats.recentUploads.map((item) => (
                  <div className="list-row" key={item._id}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Link to={`/evidence/${item._id}`} style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
                        {item.originalFilename}
                      </Link>
                      <div className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        Case: {item.case?.caseNumber || 'N/A'} · By {item.uploadedBy?.name || 'System'} · {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge value={item.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Evidence Intake */}
            <div className="panel" style={{ marginTop: 12 }}>
              <span className="meta-label">MONTHLY INTAKE</span>
              <h3 className="section-title" style={{ marginTop: 4, marginBottom: 20 }}>Evidence acquisition curve</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 120, paddingTop: 16 }}>
                {stats.monthlyEvidence.map((m) => {
                  const heightPercent = Math.max(10, (m.count / maxMonthly) * 100);
                  return (
                    <div key={`${m.year}-${m.month}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>{m.count}</span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 24,
                          background: 'rgba(255, 255, 255, 0.15)',
                          borderRadius: '2px 2px 0 0',
                          height: `${heightPercent}%`,
                          transition: 'height 0.4s ease, background 0.2s ease',
                        }}
                        title={`${m.count} items in ${MONTH_NAMES[m.month - 1]}`}
                      />
                      <div className="muted" style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                        {MONTH_NAMES[m.month - 1]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right: Custody Activity Timeline */}
        <Reveal delay={250}>
          <div>
            <span className="meta-label">RECENT ACTIVITY</span>
            <h3 className="section-title" style={{ marginTop: 4, marginBottom: 24 }}>Immutable custody log</h3>

            {stats.recentActivity.length === 0 && <p className="muted">No custody events logged.</p>}
            <div className="custody-timeline">
              {stats.recentActivity.map((log, idx) => (
                <div className={`custody-item ${idx === 0 ? 'active' : ''}`} key={log._id}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', letterSpacing: '0.01em' }}>
                    {log.action.replaceAll('_', ' ')}
                  </div>
                  <div className="muted" style={{ marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {log.user?.name || 'System'} · {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ marginTop: 8, marginBottom: 8 }}>
        {value}
      </div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</div>}
    </div>
  );
}
