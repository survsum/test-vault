import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', marginBottom: 20 }}>
          <ShieldAlert size={32} />
        </div>
        <h1 style={{ fontSize: 28 }}>404 — Access Restricted</h1>
        <p className="subtitle" style={{ marginTop: 8, marginBottom: 24 }}>
          The requested resource route does not exist or has been relocated within the Digital Evidence Vault.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
