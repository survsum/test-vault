import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Badge';
import { User, KeyRound, Shield, CheckCircle2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title-group">
          <h1>Investigator Profile</h1>
          <p>Personal clearance credentials & security settings</p>
        </div>
      </div>

      <div className="two-col">
        {/* Account Details Card */}
        <div className="panel panel-glow">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <User size={16} style={{ color: 'var(--accent-light)' }} />
            <span>Authenticated Credentials</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--panel-border)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8 0%, var(--accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{user.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{user.email}</div>
              <div style={{ marginTop: 8 }}>
                <Badge value={user.role} />
              </div>
            </div>
          </div>

          <dl className="detail-grid">
            <dt>Full Name</dt>
            <dd>{user.name}</dd>
            <dt>Email Address</dt>
            <dd>{user.email}</dd>
            <dt>Clearance Role</dt>
            <dd>
              <Badge value={user.role} />
            </dd>
          </dl>
        </div>

        {/* Change Password Form */}
        <div className="panel">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <KeyRound size={16} style={{ color: 'var(--accent-light)' }} />
            <span>Update Security Credentials</span>
          </div>

          {error && <div className="login-error">{error}</div>}
          {success && (
            <div className="alert-box alert-low" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: '#34d399', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input required type="password" placeholder="••••••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input required type="password" minLength={8} placeholder="Min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 8 }}>
              <KeyRound size={16} />
              {submitting ? 'Updating Credentials…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
