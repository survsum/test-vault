import { useEffect, useState } from 'react';
import api from '../services/api';
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/Feedback';
import Reveal from '../components/Reveal';
import { Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [error, setError] = useState('');

  function load(page = 1) {
    setError('');
    api
      .get('/audit-logs', { params: { page, action: action || undefined, resourceType: resourceType || undefined } })
      .then(({ data }) => {
        setLogs(data.data);
        setPagination(data.pagination);
      })
      .catch(() => setError('Could not load audit logs from server.'));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, resourceType]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ marginBottom: 32 }}>
          <span className="meta-label">FORENSIC ARCHIVE</span>
          <h1 className="display-heading">Immutable audit log</h1>
          <p className="display-subtext">Immutable historical registry of custody transitions and evidence operations.</p>
        </div>
      </Reveal>

      {/* Filters */}
      <Reveal delay={100}>
        <div className="filters-bar">
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
            <option value="">All Resource Types</option>
            <option value="Case">Case Workspaces</option>
            <option value="Evidence">Evidence Items</option>
            <option value="User">User Accounts</option>
            <option value="AuditLog">System Reports</option>
          </select>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <input
              placeholder="Filter by action key (e.g. EVIDENCE_UPLOADED)…"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              style={{ width: '100%', paddingLeft: 38 }}
            />
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </Reveal>

      {error && <ErrorState message={error} />}
      {!error && !logs && <LoadingState label="Querying immutable audit archive…" />}
      {logs && logs.length === 0 && <EmptyState label="No audit log entries found." />}

      {logs && logs.length > 0 && (
        <Reveal delay={150}>
          <div className="panel" style={{ padding: '8px 16px' }}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor / Role</th>
                    <th>Action Event</th>
                    <th>Target Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)' }} className="muted">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: '#fff', fontSize: 13 }}>
                          {log.user?.name || 'System Task'}
                        </span>{' '}
                        {log.user?.role && (
                          <span className="muted" style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                            [{log.user.role}]
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {log.action.replaceAll('_', ' ')}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', border: '1px solid var(--panel-border)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)' }}>
                          {log.resourceType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} onChange={load} />
          </div>
        </Reveal>
      )}
    </div>
  );
}
