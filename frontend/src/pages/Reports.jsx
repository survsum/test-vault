import { useEffect, useState } from 'react';
import api from '../services/api';
import Reveal from '../components/Reveal';
import { Download } from 'lucide-react';

async function downloadReport(url, filename) {
  const response = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState('');
  const [error, setError] = useState('');
  const [compilingState, setCompilingState] = useState(null); // string or null

  useEffect(() => {
    api.get('/cases', { params: { limit: 100 } }).then(({ data }) => setCases(data.data));
    api.get('/evidence', { params: { limit: 100 } }).then(({ data }) => setEvidenceItems(data.data));
  }, []);

  async function handle(steps, fn) {
    setError('');
    try {
      for (const step of steps) {
        setCompilingState(step);
        await new Promise((r) => setTimeout(r, 400));
      }
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate report document.');
    } finally {
      setCompilingState(null);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ marginBottom: 32 }}>
          <span className="meta-label">REPORTS</span>
          <h1 className="display-heading">Generate forensic intelligence</h1>
          <p className="display-subtext">Certified PDF reports and chain-of-custody intelligence documents.</p>
        </div>
      </Reveal>

      {error && <div className="login-error">{error}</div>}

      {/* Cinematic Processing State Notice */}
      {compilingState && (
        <div className="alert-box" style={{ background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="status-dot-green" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, letterSpacing: '0.04em' }}>
              {compilingState}…
            </span>
          </div>
        </div>
      )}

      <Reveal delay={100}>
        <div className="report-list">
          {/* Case Summary Report */}
          <div className="report-card">
            <span className="meta-label">CASE REPORT</span>
            <h3 style={{ margin: '6px 0 8px', fontSize: 18, fontFamily: 'var(--font-serif)', color: '#fff', fontWeight: 400 }}>
              Case Summary
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, minHeight: 40, margin: '0 0 16px' }}>
              Summary of an investigation case including assigned evidence items and custody state.
            </p>
            <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)} style={{ width: '100%', marginBottom: 16 }}>
              <option value="">Select a case workspace…</option>
              {cases.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.caseNumber} — {c.title}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              disabled={!selectedCase || Boolean(compilingState)}
              onClick={() =>
                handle(
                  ['Preparing evidence records', 'Compiling case history', 'Generating PDF report'],
                  () => downloadReport(`/reports/case/${selectedCase}`, `case-${selectedCase}.pdf`)
                )
              }
              style={{ width: '100%' }}
            >
              <Download size={14} /> Export Case PDF
            </button>
          </div>

          {/* Evidence Summary Report */}
          <div className="report-card">
            <span className="meta-label">REGISTRY REPORT</span>
            <h3 style={{ margin: '6px 0 8px', fontSize: 18, fontFamily: 'var(--font-serif)', color: '#fff', fontWeight: 400 }}>
              Vault Summary
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, minHeight: 40, margin: '0 0 16px' }}>
              Comprehensive status breakdown across all evidence registered in the vault.
            </p>
            <button
              className="btn btn-primary"
              disabled={Boolean(compilingState)}
              onClick={() =>
                handle(
                  ['Scanning evidence registry', 'Calculating status metrics', 'Generating PDF report'],
                  () => downloadReport('/reports/evidence-summary', 'evidence-summary-report.pdf')
                )
              }
              style={{ width: '100%', marginTop: 42 }}
            >
              <Download size={14} /> Export Vault PDF
            </button>
          </div>

          {/* Chain of Custody Report */}
          <div className="report-card">
            <span className="meta-label">CUSTODY REPORT</span>
            <h3 style={{ margin: '6px 0 8px', fontSize: 18, fontFamily: 'var(--font-serif)', color: '#fff', fontWeight: 400 }}>
              Chain of Custody
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, minHeight: 40, margin: '0 0 16px' }}>
              Certified chain of custody audit trail report for a specific evidence file.
            </p>
            <select value={selectedEvidence} onChange={(e) => setSelectedEvidence(e.target.value)} style={{ width: '100%', marginBottom: 16 }}>
              <option value="">Select an evidence item…</option>
              {evidenceItems.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.originalFilename}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              disabled={!selectedEvidence || Boolean(compilingState)}
              onClick={() =>
                handle(
                  ['Retrieving custody timeline', 'Verifying SHA-256 signatures', 'Generating PDF report'],
                  () => downloadReport(`/reports/chain-of-custody/${selectedEvidence}`, `custody-${selectedEvidence}.pdf`)
                )
              }
              style={{ width: '100%' }}
            >
              <Download size={14} /> Export Custody PDF
            </button>
          </div>

          {/* System Audit Report */}
          <div className="report-card">
            <span className="meta-label">SYSTEM REPORT</span>
            <h3 style={{ margin: '6px 0 8px', fontSize: 18, fontFamily: 'var(--font-serif)', color: '#fff', fontWeight: 400 }}>
              System Audit
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, minHeight: 40, margin: '0 0 16px' }}>
              Full system audit trail log report covering access events and security history.
            </p>
            <button
              className="btn btn-primary"
              disabled={Boolean(compilingState)}
              onClick={() =>
                handle(
                  ['Filtering audit events', 'Compiling security log', 'Generating PDF report'],
                  () => downloadReport('/reports/audit', 'system-audit-report.pdf')
                )
              }
              style={{ width: '100%', marginTop: 42 }}
            >
              <Download size={14} /> Export Audit PDF
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
