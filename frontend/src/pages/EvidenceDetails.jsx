import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState } from '../components/Feedback';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Reveal from '../components/Reveal';
import { 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  ArrowLeft, 
  AlertTriangle 
} from 'lucide-react';

export default function EvidenceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const canReview = user.role === 'ADMIN' || user.role === 'SUPERVISOR';

  function load() {
    api
      .get(`/evidence/${id}`)
      .then(({ data }) => setData(data.data))
      .catch(() => setError('Could not load this evidence item.'));
  }

  useEffect(load, [id]);

  async function handleApprove() {
    await api.post(`/evidence/${id}/approve`);
    load();
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data } = await api.post(`/evidence/${id}/verify`);
      setVerifyResult(data.data);
      load();
    } catch (err) {
      setVerifyResult({ error: err.response?.data?.message || 'Verification failed.' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleDownload() {
    setDownloadError('');
    try {
      const response = await api.get(`/evidence/${id}/download`, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = data.evidence.originalFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setDownloadError('Download blocked — integrity check failed or file is unavailable on server.');
    }
  }

  function handleCopyHash(sha256) {
    navigator.clipboard.writeText(sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Inspecting evidence file & verifying cryptographic signature…" />;

  const { evidence: e, chainOfCustody } = data;

  const fileSizeMB = (e.fileSize / (1024 * 1024)).toFixed(2);
  const formattedDate = new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const formattedTime = new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/evidence" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <ArrowLeft size={13} /> Return to Evidence Registry
        </Link>
      </div>

      {/* Editorial Title Block */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <span className="meta-label">EVIDENCE RECORD</span>
            <h1 className="display-heading">{e.originalFilename}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{e.mimeType?.toUpperCase() || 'FILE'}</span>
              <span>·</span>
              <span>{fileSizeMB} MB</span>
              <span>·</span>
              <Badge value={e.status} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handleVerify} disabled={verifying}>
              <ShieldCheck size={14} />
              {verifying ? 'Verifying...' : 'Verify Integrity'}
            </button>
            <button className="btn btn-primary" onClick={handleDownload}>
              <Download size={14} /> Download Record
            </button>
            {canReview && e.status === 'PENDING' && (
              <>
                <button className="btn btn-success" onClick={handleApprove}>
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button className="btn btn-danger" onClick={() => setShowReject(true)}>
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
          </div>
        </div>
      </Reveal>

      {/* Verification Notifications */}
      {downloadError && (
        <div className="alert-box alert-critical" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} />
            <span>{downloadError}</span>
          </div>
        </div>
      )}

      {verifyResult && !verifyResult.error && (
        <div
          className="alert-box"
          style={{
            marginBottom: 24,
            background: verifyResult.valid ? 'var(--success-bg)' : 'var(--danger-bg)',
            borderColor: verifyResult.valid ? 'var(--success-border)' : 'var(--danger-border)',
            color: verifyResult.valid ? '#6ee7b7' : '#fca5a5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {verifyResult.valid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, letterSpacing: '0.02em' }}>
                {verifyResult.valid ? 'Cryptographic Integrity Confirmed' : 'WARNING: Hash Mismatch Detected'}
              </div>
              <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>
                {verifyResult.valid
                  ? 'Dynamic SHA-256 digest matches the stored upload record.'
                  : 'Computed digest does not match original vault digest.'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="editorial-divider" />

      {/* Two Column Layout: Details & Chain of Custody */}
      <div className="two-col">
        {/* Left Column */}
        <Reveal delay={100}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Cryptographic SHA-256 Box */}
            <div>
              <span className="meta-label">INTEGRITY & HASH</span>
              <h3 className="section-title" style={{ marginTop: 4, marginBottom: 12 }}>SHA-256 Checksum</h3>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#fff', wordBreak: 'break-all', letterSpacing: '0.04em' }}>
                  {e.sha256}
                </span>
                <button className="icon-btn" onClick={() => handleCopyHash(e.sha256)} title="Copy SHA-256">
                  {copiedHash ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Metadata DL */}
            <div>
              <span className="meta-label">FILE SPECIFICATIONS</span>
              <h3 className="section-title" style={{ marginTop: 4, marginBottom: 16 }}>Technical metadata</h3>
              <dl className="detail-grid">
                <dt>Case Association</dt>
                <dd>
                  {e.case?._id ? (
                    <Link to={`/cases/${e.case._id}`} style={{ fontWeight: 500, color: '#fff' }}>
                      {e.case.caseNumber}
                    </Link>
                  ) : (
                    'Unassigned'
                  )}
                </dd>
                <dt>Uploaded</dt>
                <dd style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formattedDate} · {formattedTime}</dd>
                <dt>Uploaded By</dt>
                <dd>{e.uploadedBy?.name || 'Unknown User'}</dd>
                {e.reviewedBy && (
                  <>
                    <dt>Reviewed By</dt>
                    <dd>{e.reviewedBy?.name}</dd>
                  </>
                )}
                {e.status === 'REJECTED' && (
                  <>
                    <dt>Rejection Reason</dt>
                    <dd style={{ color: 'var(--danger)' }}>{e.rejectionReason}</dd>
                  </>
                )}
                <dt>Description</dt>
                <dd style={{ color: 'var(--text-secondary)' }}>{e.description || 'No description provided.'}</dd>
              </dl>
            </div>
          </div>
        </Reveal>

        {/* Right Column: Chain of Custody */}
        <Reveal delay={150}>
          <div>
            <span className="meta-label">CHAIN OF CUSTODY</span>
            <h3 className="section-title" style={{ marginTop: 4, marginBottom: 24 }}>Audit & Custody Timeline</h3>

            {chainOfCustody.length === 0 && <p className="muted">No history logged.</p>}
            <div className="custody-timeline">
              {chainOfCustody.map((log, idx) => (
                <div className={`custody-item ${idx === 0 ? 'active' : ''}`} key={log._id}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                    {log.action.replaceAll('_', ' ')}
                  </div>
                  <div className="muted" style={{ marginTop: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {log.user?.name || 'System'} ({log.user?.role || 'SYSTEM'}) · {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {showReject && (
        <RejectModal
          evidenceId={id}
          onClose={() => setShowReject(false)}
          onDone={() => {
            setShowReject(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function RejectModal({ evidenceId, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/evidence/${evidenceId}/reject`, { reason });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject evidence.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Reject Evidence Item" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label>Reason for Rejection</label>
          <textarea
            required
            rows={3}
            placeholder="Specify reason for rejection…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={submitting}>
            {submitting ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
