import { useEffect, useState } from 'react';
import api from '../services/api';
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/Feedback';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Reveal from '../components/Reveal';
import { UserPlus, Search, KeyRound, Trash2, RotateCcw } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  function load(page = 1) {
    setError('');
    api
      .get('/users', { params: { page, role: role || undefined, status: status || undefined, search: search || undefined } })
      .then(({ data }) => {
        setUsers(data.data);
        setPagination(data.pagination);
      })
      .catch(() => setError('Could not load user accounts.'));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  async function toggleActive(u) {
    await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
    load(pagination.page);
  }

  async function deleteUser(u) {
    if (!window.confirm(`Revoke clearance for user ${u.name}?`)) return;
    await api.delete(`/users/${u.id}`);
    load(pagination.page);
  }

  async function restoreUser(u) {
    await api.post(`/users/${u.id}/restore`);
    load(pagination.page);
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <span className="meta-label">ACCESS CONTROL</span>
            <h1 className="display-heading">User accounts</h1>
            <p className="display-subtext">Role-based access management and identity administration.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> Provision User
          </button>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="filters-bar">
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <input
              placeholder="Search name or email address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
              style={{ width: '100%', paddingLeft: 38 }}
            />
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All RBAC Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="INVESTIGATOR">Investigator</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Active + Inactive</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="deleted">Deleted Accounts</option>
          </select>
          <button className="btn btn-secondary" onClick={() => load(1)}>
            Search
          </button>
        </div>
      </Reveal>

      {error && <ErrorState message={error} />}
      {!error && !users && <LoadingState label="Loading user directory…" />}
      {users && users.length === 0 && <EmptyState label="No user accounts match filters." />}

      {users && users.length > 0 && (
        <Reveal delay={150}>
          <div className="panel" style={{ padding: '8px 16px' }}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>RBAC Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span style={{ fontWeight: 500, color: '#fff', fontSize: 13.5 }}>{u.name}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} className="muted">
                        {u.email}
                      </td>
                      <td>
                        <Badge value={u.role} />
                      </td>
                      <td>
                        <Badge value={u.isActive}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {status === 'deleted' ? (
                            <button className="btn btn-secondary" onClick={() => restoreUser(u)} style={{ padding: '4px 10px', fontSize: 11 }}>
                              <RotateCcw size={12} /> Restore
                            </button>
                          ) : (
                            <>
                              <button className="btn btn-secondary" onClick={() => toggleActive(u)} style={{ padding: '4px 10px', fontSize: 11 }}>
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="btn btn-secondary" onClick={() => setResetTarget(u)} style={{ padding: '4px 10px', fontSize: 11 }}>
                                <KeyRound size={12} /> Password
                              </button>
                              <button className="btn btn-danger" onClick={() => deleteUser(u)} style={{ padding: '4px 10px', fontSize: 11 }}>
                                <Trash2 size={12} /> Revoke
                              </button>
                            </>
                          )}
                        </div>
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
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load(1);
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => setResetTarget(null)}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('INVESTIGATOR');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users', { name, email, password, role });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Provision User Account" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label>Full Name</label>
          <input required placeholder="e.g. Saurav Kumar" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input required type="email" placeholder="name@vault.test" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label>Temporary Password</label>
          <input required type="password" minLength={8} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div className="form-group">
          <label>RBAC Role Clearance</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%' }}>
            <option value="ADMIN">ADMIN — Full Administrative Clearance</option>
            <option value="SUPERVISOR">SUPERVISOR — Review & Intelligence Clearance</option>
            <option value="INVESTIGATOR">INVESTIGATOR — Case & Evidence Operator</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Provisioning…' : 'Provision User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/users/${user.id}/reset-password`, { newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset user password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Reset Credentials — ${user.name}`} onClose={onClose}>
      {done ? (
        <div>
          <p style={{ color: 'var(--success)', fontWeight: 500, fontSize: 13.5 }}>
            Temporary credentials updated.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={onDone}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label>New Temporary Password</label>
            <input required type="password" minLength={8} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating…' : 'Reset Credentials'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
