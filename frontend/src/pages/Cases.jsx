import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/Feedback';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Reveal from '../components/Reveal';
import { Search, Plus, Calendar, ArrowRight } from 'lucide-react';

export default function Cases() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = user.role === 'ADMIN' || user.role === 'SUPERVISOR';

  function load(page = 1) {
    setError('');
    api
      .get('/cases', { params: { page, status: status || undefined, search: search || undefined } })
      .then(({ data }) => {
        setCases(data.data);
        setPagination(data.pagination);
      })
      .catch(() => setError('Could not load cases from server.'));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(1);
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <span className="meta-label">INVESTIGATIONS</span>
            <h1 className="display-heading">Active cases</h1>
            <p className="display-subtext">Classified evidence containers and ongoing forensic investigations.</p>
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Initialize Case
            </button>
          )}
        </div>
      </Reveal>

      {/* Filter Bar */}
      <Reveal delay={100}>
        <form className="filters-bar" onSubmit={handleSearchSubmit}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <input
              placeholder="Search by case #, title or summary…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 38 }}
            />
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button className="btn btn-secondary" type="submit">
            Search
          </button>
        </form>
      </Reveal>

      {error && <ErrorState message={error} />}
      {!error && !cases && <LoadingState label="Loading cases archive…" />}
      {cases && cases.length === 0 && <EmptyState label="No investigative cases found." />}

      {cases && cases.length > 0 && (
        <Reveal delay={150}>
          <div className="panel" style={{ padding: '8px 16px' }}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Case Identifier</th>
                    <th>Investigation Title</th>
                    <th>Status</th>
                    <th>Assigned Investigators</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c._id} className="table-row-link" onClick={() => navigate(`/cases/${c._id}`)}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {c.caseNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#fff', fontSize: 14 }}>{c.title}</div>
                        {c.description && (
                          <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge value={c.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {c.assignedInvestigators.length === 0 ? (
                            <span className="muted">—</span>
                          ) : (
                            c.assignedInvestigators.map((i) => (
                              <span key={i._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 4, fontSize: 11.5, border: '1px solid var(--panel-border)' }}>
                                {i.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }} className="muted">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" title="Inspect Case Workspace">
                          <ArrowRight size={15} />
                        </button>
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

      {showCreate && (
        <CreateCaseModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load(1);
          }}
        />
      )}
    </div>
  );
}

function CreateCaseModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [investigators, setInvestigators] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/users/investigators').then(({ data }) => setInvestigators(data.data));
  }, []);

  function toggleInvestigator(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/cases', { title, description, assignedInvestigators: selected });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create case.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Initialize Case Container" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label>Case Title</label>
          <input required placeholder="e.g. EV-2026 Unauthorized Access Inquiry" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label>Investigation Summary & Objectives</label>
          <textarea rows={3} placeholder="Define scope and intelligence parameters…" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label>Assigned Investigators</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {investigators.length === 0 && <span className="muted">No investigators available.</span>}
            {investigators.map((inv) => (
              <label key={inv._id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={selected.includes(inv._id)} onChange={() => toggleInvestigator(inv._id)} />
                <span style={{ color: '#fff', fontWeight: 500 }}>{inv.name}</span>
                <span className="muted" style={{ fontSize: 11 }}>({inv.email})</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Initializing…' : 'Create Case Workspace'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
