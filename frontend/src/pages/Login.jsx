import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, KeyRound } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Check credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  function fillCreds(demoEmail) {
    setEmail(demoEmail);
    setPassword('Password123!');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand-header">
          <h1>DIGITAL EVIDENCE VAULT</h1>
          <p className="subtitle">AUTHENTICATED FORENSIC PORTAL</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Investigator Email</label>
            <input
              id="email"
              type="email"
              required
              placeholder="name@vault.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Security Clearance Credentials</label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8, padding: '11px 18px', fontSize: 13.5 }}>
            {submitting ? 'Authenticating Clearance…' : 'Authenticate Access'}
            {!submitting && <ArrowRight size={15} />}
          </button>
        </form>

        <div className="dev-creds">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-muted)', fontWeight: 500 }}>
            <KeyRound size={13} />
            <span>Development Quick-Login Clearance:</span>
          </div>
          <div className="dev-creds-pills">
            <button className="dev-cred-chip" onClick={() => fillCreds('admin@vault.test')}>
              ADMIN (admin@vault.test)
            </button>
            <button className="dev-cred-chip" onClick={() => fillCreds('supervisor@vault.test')}>
              SUPERVISOR (supervisor@vault.test)
            </button>
            <button className="dev-cred-chip" onClick={() => fillCreds('investigator1@vault.test')}>
              INVESTIGATOR (investigator1@vault.test)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
