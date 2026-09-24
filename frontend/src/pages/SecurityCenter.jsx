import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LoadingState, ErrorState } from '../components/Feedback';
import Badge from '../components/Badge';
import Reveal from '../components/Reveal';
import { 
  ShieldAlert, 
  ArrowRight, 
  Download 
} from 'lucide-react';

async function downloadExport(url, filename) {
  const response = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export default function SecurityCenter() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    api
      .get('/security/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => setError('Could not load security statistics.'));
    api
      .get('/security/alerts')
      .then(({ data }) => setAlerts(data.data))
      .catch(() => setAlerts([]));
  }, []);

  async function handleExport(fn) {
    setExportError('');
    try {
      await fn();
    } catch {
      setExportError('Could not generate report export file.');
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!stats) return <LoadingState label="Scanning security telemetry and access events…" />;

  const maxDaily = Math.max(1, ...stats.eventsOverTime.map((d) => d.count));
  const maxRisk = Math.max(1, ...stats.byRiskLevel.map((r) => r.count));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <span className="meta-label">SECURITY CENTER</span>
            <h1 className="display-heading">System integrity and access activity</h1>
            <p className="display-subtext">Real-time threat monitoring and cryptographic audit logs.</p>
          </div>
          <Link className="btn btn-primary" to="/security/events">
            <ShieldAlert size={14} /> Security Events Log
          </Link>
        </div>
      </Reveal>

      {/* Primary Security Metrics */}
      <Reveal delay={100}>
        <div className="stats-grid">
          <StatCard label="TOTAL EVENTS" value={stats.totalEvents} />
          <StatCard label="FAILED LOGINS" value={stats.failedLogins} />
          <StatCard label="UNAUTHORIZED ACCESS" value={stats.unauthorizedAccess} />
          <StatCard label="INTEGRITY FAILURES" value={stats.integrityFailures} />
        </div>
      </Reveal>

      <div className="editorial-divider" />

      {/* Security Threat Alerts */}
      <Reveal delay={150}>
        <div style={{ marginBottom: 40 }}>
          <span className="meta-label">ACTIVE ALERTS</span>
          <h3 className="section-title" style={{ marginTop: 4, marginBottom: 20 }}>High Risk & Critical Telemetry</h3>

          {alerts && alerts.length === 0 && (
            <p className="muted" style={{ padding: '8px 0' }}>
              No unresolved security alerts present in the system.
            </p>
          )}
          {alerts &&
            alerts.map((a) => (
              <div
                key={a._id}
                className={`alert-box alert-${a.riskLevel.toLowerCase()}`}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: 12 }}
                onClick={() => navigate(`/security/events/${a._id}`)}
              >
                <div>
                  <strong style={{ fontSize: 13.5 }}>{a.action.replaceAll('_', ' ')}</strong>
                  <div style={{ fontSize: 11.5, marginTop: 3, opacity: 0.85, fontFamily: 'var(--font-mono)' }}>
                    {a.description || 'No notes.'} · {new Date(a.createdAt).toLocaleString()} · IP: {a.ipAddress || 'Internal'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Badge value={a.riskLevel} />
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
        </div>
      </Reveal>

      {/* Risk Distribution & Event Frequency */}
      <div className="two-col" style={{ marginBottom: 40 }}>
        <Reveal delay={200}>
          <div className="panel">
            <span className="meta-label">ACTIVITY FREQUENCY</span>
            <h3 className="section-title" style={{ marginTop: 4, marginBottom: 20 }}>30-Day Security Event Curve</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110, paddingTop: 10 }}>
              {stats.eventsOverTime.map((d) => (
                <div key={d.date} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '2px 2px 0 0',
                      width: '100%',
                      maxWidth: 16,
                      height: `${(d.count / maxDaily) * 80 + 4}px`,
                      margin: '0 auto',
                    }}
                    title={`${d.date}: ${d.count} events`}
                  />
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={250}>
          <div className="panel">
            <span className="meta-label">SEVERITY ANALYSIS</span>
            <h3 className="section-title" style={{ marginTop: 4, marginBottom: 20 }}>Risk Level Distribution</h3>
            {stats.byRiskLevel.map((r) => (
              <div key={r.riskLevel} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, alignItems: 'center' }}>
                  <Badge value={r.riskLevel} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{r.count}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 2, height: 4 }}>
                  <div
                    style={{
                      width: `${(r.count / maxRisk) * 100}%`,
                      background:
                        r.riskLevel === 'CRITICAL'
                          ? 'var(--critical)'
                          : r.riskLevel === 'HIGH'
                          ? 'var(--danger)'
                          : r.riskLevel === 'MEDIUM'
                          ? 'var(--warning)'
                          : 'rgba(255, 255, 255, 0.3)',
                      height: 4,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Recent Events Table */}
      <Reveal delay={300}>
        <div style={{ marginBottom: 40 }}>
          <span className="meta-label">TELEMETRY REGISTRY</span>
          <h3 className="section-title" style={{ marginTop: 4, marginBottom: 20 }}>Recent Security Telemetry Log</h3>
          {stats.recentEvents.length > 0 && (
            <div className="panel" style={{ padding: '8px 16px' }}>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User / Target</th>
                      <th>Event Action</th>
                      <th>Status</th>
                      <th>Risk</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentEvents.map((e) => (
                      <tr key={e._id} className="table-row-link" onClick={() => navigate(`/security/events/${e._id}`)}>
                        <td style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }} className="muted">
                          {new Date(e.createdAt).toLocaleString()}
                        </td>
                        <td style={{ fontSize: 13, color: '#fff' }}>
                          {e.user?.name || e.emailAttempted || 'System'}
                        </td>
                        <td style={{ fontWeight: 500 }}>{e.action.replaceAll('_', ' ')}</td>
                        <td>
                          <Badge value={e.status} />
                        </td>
                        <td>
                          <Badge value={e.riskLevel} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="icon-btn">
                            <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* Report Exports Module */}
      <Reveal delay={350}>
        <div className="panel">
          <span className="meta-label">DATA EXPORT</span>
          <h3 className="section-title" style={{ marginTop: 4, marginBottom: 16 }}>Security Audit Log & Activity Exports</h3>
          {exportError && <div className="login-error">{exportError}</div>}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() =>
                handleExport(() => downloadExport('/security/export/security-report', `security-report-${new Date().toISOString().slice(0, 10)}.xlsx`))
              }
            >
              <Download size={14} /> Export Security Log (.xlsx)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() =>
                handleExport(() => downloadExport('/security/export/audit-logs', `audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`))
              }
            >
              <Download size={14} /> Export Audit Log (.xlsx)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() =>
                handleExport(() =>
                  downloadExport('/security/export/evidence-activity', `evidence-activity-${new Date().toISOString().slice(0, 10)}.xlsx`)
                )
              }
            >
              <Download size={14} /> Export Evidence Records (.xlsx)
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ marginTop: 8 }}>
        {value}
      </div>
    </div>
  );
}
