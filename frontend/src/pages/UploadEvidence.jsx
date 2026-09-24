import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Reveal from '../components/Reveal';
import { Upload, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';

export default function UploadEvidence() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    api.get('/cases', { params: { limit: 100, status: 'OPEN' } }).then(({ data }) => setCases(data.data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please select an evidence file.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('caseId', caseId);
      formData.append('description', description);
      formData.append('file', file);
      const { data } = await api.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/evidence/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/evidence" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <ArrowLeft size={13} /> Return to Evidence Registry
        </Link>
      </div>

      <Reveal delay={0}>
        <div style={{ marginBottom: 32 }}>
          <span className="meta-label">INTAKE</span>
          <h1 className="display-heading">Ingest evidence file</h1>
          <p className="display-subtext">Automatic SHA-256 cryptographic checksum calculation upon receipt.</p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="panel" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label>Target Case Workspace</label>
              <select required value={caseId} onChange={(e) => setCaseId(e.target.value)} style={{ width: '100%' }}>
                <option value="">Select an open case…</option>
                {cases.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.caseNumber} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Evidence Scope & Acquisition Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional acquisition notes or source details…"
                style={{ width: '100%' }}
              />
            </div>

            {/* Drag & Drop File Zone */}
            <div className="form-group">
              <label>Evidence Payload File</label>
              <div
                className={`dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('evidence-file-input').click()}
              >
                <input
                  id="evidence-file-input"
                  type="file"
                  required
                  style={{ display: 'none' }}
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Upload size={22} style={{ color: 'var(--text-muted)' }} />
                  {file ? (
                    <div>
                      <div style={{ fontWeight: 500, color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />
                        {file.name}
                      </div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        {(file.size / 1024).toFixed(1)} KB · Click to choose different file
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 500, color: '#fff', fontSize: 13.5 }}>
                        Drag & drop file or click to browse
                      </div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                        Supports documents, disk images, archives, & media
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <Shield size={12} />
                <span>SHA-256 hash digest is computed client-server side and permanently sealed.</span>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', padding: '11px 18px', fontSize: 13.5 }}>
                {submitting ? 'Ingesting Payload & Computing Hash…' : 'Ingest Evidence Payload'}
              </button>
            </div>
          </form>
        </div>
      </Reveal>
    </div>
  );
}
