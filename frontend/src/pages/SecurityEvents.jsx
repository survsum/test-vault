import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/Feedback';
import Badge from '../components/Badge';
import { ShieldAlert, Search, Calendar, Filter, ArrowLeft, ArrowRight, Terminal } from 'lucide-react';

export default function SecurityEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [eventType, setEventType] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  function load(page = 1) {
    setError('');
    api
      .get('/security/events', {
        params: {
          page,
          eventType: eventType || undefined,
          riskLevel: riskLevel || undefined,
          search: search || undefined,
          from: from || undefined,
          to: to || undefined,
        },
      })
      .then(({ data }) => {
        setEvents(data.data);
        setPagination(data.pagination);
      })
      .catch(() => setError('Could not load security events from server.'));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, riskLevel]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(1);
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/security" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }} className="muted">
          <ArrowLeft size={14} /> Back to Security Command Center
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-title-group">
          <h1>Security Event Log</h1>
          <p>Filtered granular audit log of system security events, authentication attempts, & access control</p>
        </div>
      </div>

      <form className="filters-bar" onSubmit={handleSearchSubmit}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <input
            placeholder="Search description, IP, user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 38 }}
          />
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
          <option value="">All Event Categories</option>
          <option value="AUTHENTICATION">Authentication</option>
          <option value="AUTHORIZATION">Authorization</option>
          <option value="EVIDENCE">Evidence Operations</option>
          <option value="CASE">Case Operations</option>
          <option value="USER">User Management</option>
          <option value="TOKEN">Token Audit</option>
          <option value="SYSTEM">System Infrastructure</option>
          <option value="SECURITY">Security Threats</option>
        </select>
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
          <option value="">All Risk Severities</option>
          <option value="LOW">Low Severity</option>
          <option value="MEDIUM">Medium Severity</option>
          <option value="HIGH">High Severity</option>
          <option value="CRITICAL">Critical Severity</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From Date" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To Date" />
        <button className="btn btn-secondary" type="submit">
          Search
        </button>
      </form>

      {error && <ErrorState message={error} />}
      {!error && !events && <LoadingState label="Loading security event logs…" />}
      {events && events.length === 0 && <EmptyState label="No security events match the specified filters." />}

      {events && events.length > 0 && (
        <div className="panel">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Email</th>
                  <th>Role</th>
                  <th>Category</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Outcome</th>
                  <th>Severity</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e._id} className="table-row-link" onClick={() => navigate(`/security/events/${e._id}`)}>
                    <td>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {new Date(e.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#fff' }}>
                        {e.user?.name || e.emailAttempted || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {e.userRole || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: 10 }}>
                        {e.eventType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{e.action.replaceAll('_', ' ')}</span>
                    </td>
                    <td>
                      <span className="hash-pill" style={{ fontSize: 11 }}>
                        {e.ip || '—'}
                      </span>
                    </td>
                    <td>
                      <Badge value={e.status} />
                    </td>
                    <td>
                      <Badge value={e.riskLevel} />
                    </td>
                    <td>
                      <button className="icon-btn">
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onChange={load} />
        </div>
      )}
    </div>
  );
}
