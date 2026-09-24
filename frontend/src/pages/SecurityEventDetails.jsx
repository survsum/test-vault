import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingState, ErrorState } from '../components/Feedback';
import Badge from '../components/Badge';
import { ShieldAlert, ArrowLeft, Terminal, Server, User, Globe, FileText } from 'lucide-react';

export default function SecurityEventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/security/events/${id}`)
      .then(({ data }) => setEvent(data.data))
      .catch(() => setError('Could not load security event details.'));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!event) return <LoadingState label="Inspecting security event payload…" />;

  const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/security/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }} className="muted">
          <ArrowLeft size={14} /> Back to Security Events Log
        </Link>
      </div>

      <div className="page-header">
        <div className="page-header-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-purple">{event.eventType}</span>
            <Badge value={event.riskLevel} />
            <Badge value={event.status} />
          </div>
          <h1>{event.action.replaceAll('_', ' ')}</h1>
        </div>
      </div>

      <div className="panel panel-glow" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={16} style={{ color: 'var(--accent-light)' }} />
          <span>Security Event Metadata & Payload</span>
        </div>

        <dl className="detail-grid">
          <dt>Timestamp</dt>
          <dd>{new Date(event.createdAt).toLocaleString()}</dd>
          <dt>User / Email</dt>
          <dd style={{ fontWeight: 600, color: '#fff' }}>
            {event.user?.name || event.emailAttempted || 'Unknown / Guest'}
          </dd>
          <dt>Assigned Role</dt>
          <dd>{event.userRole || '—'}</dd>
          <dt>Event Category</dt>
          <dd>{event.eventType}</dd>
          <dt>Action Key</dt>
          <dd>
            <span className="hash-pill">{event.action}</span>
          </dd>
          <dt>Resource Type</dt>
          <dd>{event.resourceType || '—'}</dd>
          <dt>Resource ID</dt>
          <dd>
            {event.resourceId ? <span className="hash-pill">{event.resourceId}</span> : '—'}
          </dd>
          <dt>Client IP Address</dt>
          <dd>
            <span className="hash-pill">{event.ip || '—'}</span>
          </dd>
          <dt>User Agent String</dt>
          <dd style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {event.userAgent || '—'}
          </dd>
          <dt>Event Description</dt>
          <dd style={{ color: 'var(--text-secondary)' }}>{event.description || 'No additional description recorded.'}</dd>
        </dl>
      </div>

      {hasMetadata && (
        <div className="panel">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Terminal size={16} style={{ color: 'var(--accent-light)' }} />
            <span>Raw Event JSON Metadata Payload</span>
          </div>
          <pre
            style={{
              background: 'rgba(0,0,0,0.6)',
              padding: 18,
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              color: '#a5b4fc',
              overflowX: 'auto',
              border: '1px solid var(--panel-border)',
              margin: 0,
            }}
          >
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
