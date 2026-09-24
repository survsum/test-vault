import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/Feedback';
import Reveal from '../components/Reveal';
import { CheckCheck, Trash2, X } from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api
      .get('/notifications')
      .then(({ data }) => setNotifications(data.data))
      .catch(() => setError('Could not load notifications from server.'));
  }

  useEffect(load, []);

  async function handleClick(n) {
    if (!n.isRead) await api.post(`/notifications/${n._id}/read`);
    if (n.link) navigate(n.link);
    load();
  }

  async function markAllRead() {
    await api.post('/notifications/read-all');
    load();
  }

  async function clearRead() {
    await api.delete('/notifications/read');
    load();
  }

  async function deleteOne(id, e) {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`);
    load();
  }

  if (error) return <ErrorState message={error} />;
  if (!notifications) return <LoadingState label="Loading system notifications…" />;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <span className="meta-label">NOTIFICATIONS</span>
            <h1 className="display-heading">System alerts</h1>
            <p className="display-subtext">Security telemetry, custody assignments, and system notices.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={markAllRead}>
              <CheckCheck size={14} /> Mark All Read
            </button>
            <button className="btn btn-secondary" onClick={clearRead}>
              <Trash2 size={14} /> Clear Read
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="panel" style={{ padding: '12px 20px' }}>
          {notifications.length === 0 && <EmptyState label="No notifications in your inbox." />}
          {notifications.map((n) => (
            <div
              key={n._id}
              className="list-row"
              style={{
                padding: '14px 12px',
                borderBottom: '1px solid var(--panel-border)',
                cursor: 'pointer',
              }}
              onClick={() => handleClick(n)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                {!n.isRead && <span className="status-dot-green" style={{ flexShrink: 0 }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontWeight: !n.isRead ? 600 : 400, color: '#fff', fontSize: 13.5 }}>
                    {n.message}
                  </div>
                  <div className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <button className="icon-btn" onClick={(e) => deleteOne(n._id, e)} aria-label="Delete Notification" title="Dismiss">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
