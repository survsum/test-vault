import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState } from '../components/Feedback';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Reveal from '../components/Reveal';
import { UserCheck, Upload, ArrowLeft } from 'lucide-react';

export default function CaseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showAssign, setShowAssign] = useState(false);

  const canManage = user.role === 'ADMIN' || user.role === 'SUPERVISOR';

  function load() {
    api
      .get(`/cases/${id}`)
      .then(({ data }) => setData(data.data))
      .catch(() => setError('Could not load case details from server.'));
  }

  useEffect(load, [id]);

  async function updateStatus(status) {
    await api.patch(`/cases/${id}`, { status });
    load();
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading investigation case workspace…" />;

  const { case: c, evidence, activity } = data;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <ArrowLeft size={13} /> Return to Cases Archive
        </Link>
      </div>

      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <span className="meta-label">CASE {c.caseNumber}</span>
            <h1 className="display-heading">{c.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <Badge value={c.status} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {evidence.length} EVIDENCE ITEMS
              </span>
            </div>
          </div>

          {canManage && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowAssign(true)}>
                <UserCheck size={14} /> Assign Investigators
              </button>
              {c.status !== 'CLOSED' ? (
                <button className="btn btn-danger" onClick={() => updateStatus('CLOSED')}>
                  Close Case
                </button>
              ) : (
                <button className="btn btn-success" onClick={() => updateStatus('OPEN')}>
                  Reopen Case
                </button>
              )}
            </div>
          )}
        </div>
      </Reveal>

      <div className="editorial-divider" />

      {/* Two Column Section */}
      <div className="two-col">
        {/* Main Details & Evidence */}
        <Reveal delay={100}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <span className="meta-label">INVESTIGATION METADATA</span>
              <h3 className="section-title" style={{ marginTop: 4, marginBottom: 16 }}>Scope & Assignment</h3>
              <dl className="detail-grid">
                <dt>Case Number</dt>
                <dd style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.caseNumber}</dd>
                <dt>Created By</dt>
                <dd>{c.createdBy?.name || 'System'}</dd>
                <dt>Investigators</dt>
                <dd>
                  {c.assignedInvestigators.length === 0
                    ? 'Unassigned'
                    : c.assignedInvestigators.map((i) => i.name).join(', ')}
                </dd>
                <dt>Created Date</dt>
                <dd style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString()}</dd>
                <dt>Description</dt>
                <dd style={{ color: 'var(--text-secondary)' }}>{c.description || 'No detailed scope description provided.'}</dd>
              </dl>
            </div>

            {/* Evidence List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span className="meta-label">FORENSIC EVIDENCE</span>
                  <h3 className="section-title" style={{ margin: 0 }}>Associated Evidence ({evidence.length})</h3>
                </div>
                <Link className="btn btn-primary" to="/evidence/upload" style={{ padding: '6px 12px', fontSize: 12 }}>
                  <Upload size={13} /> Upload Item
                </Link>
              </div>

              {evidence.length === 0 && (
                <p className="muted" style={{ padding: '12px 0' }}>
                  No evidence items uploaded to this case yet.
                </p>
              )}

              {evidence.length > 0 && (
                <div className="panel" style={{ padding: '8px 16px' }}>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Filename</th>
                          <th>SHA-256 Digest</th>
                          <th>Status</th>
                          <th>Uploader</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evidence.map((e) => (
                          <tr key={e._id}>
                            <td>
                              <Link to={`/evidence/${e._id}`} style={{ fontWeight: 500, color: '#fff' }}>
                                {e.originalFilename}
                              </Link>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} className="muted">
                              {e.sha256 ? `${e.sha256.substring(0, 16)}…` : '—'}
                            </td>
                            <td>
                              <Badge value={e.status} />
                            </td>
                            <td>{e.uploadedBy?.name}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} className="muted">
                              {new Date(e.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Case Activity Sidebar */}
        <Reveal delay={150}>
          <div>
            <span className="meta-label">ACTIVITY LOG</span>
            <h3 className="section-title" style={{ marginTop: 4, marginBottom: 24 }}>Case Timeline</h3>

            {activity.length === 0 && <p className="muted">No activity logged yet.</p>}
            <div className="custody-timeline">
              {activity.map((log, idx) => (
                <div className={`custody-item ${idx === 0 ? 'active' : ''}`} key={log._id}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                    {log.action.replaceAll('_', ' ')}
                  </div>
                  <div className="muted" style={{ marginTop: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {log.user?.name || 'System'} · {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {showAssign && (
        <AssignModal
          caseId={c._id}
          current={c.assignedInvestigators.map((i) => i._id)}
          onClose={() => setShowAssign(false)}
          onSaved={() => {
            setShowAssign(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AssignModal({ caseId, current, onClose, onSaved }) {
  const [investigators, setInvestigators] = useState([]);
  const [selected, setSelected] = useState(current);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/investigators').then(({ data }) => setInvestigators(data.data));
  }, []);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/cases/${caseId}/assign`, { investigatorIds: selected });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update investigator assignments.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Assign Investigators to Case" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {investigators.map((inv) => (
            <label key={inv._id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={selected.includes(inv._id)} onChange={() => toggle(inv._id)} />
              <span style={{ color: '#fff', fontWeight: 500 }}>{inv.name}</span>
              <span className="muted" style={{ fontSize: 11 }}>({inv.email})</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Assignments'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
