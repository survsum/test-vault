import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/Feedback';
import Badge from '../components/Badge';
import Reveal from '../components/Reveal';
import { Search, Upload, Copy, Check, ArrowRight } from 'lucide-react';

export default function Evidence() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const canUpload = user.role === 'ADMIN' || user.role === 'INVESTIGATOR';

  function load(page = 1) {
    setError('');
    api
      .get('/evidence', { params: { page, status: status || undefined, search: search || undefined } })
      .then(({ data }) => {
        setItems(data.data);
        setPagination(data.pagination);
      })
      .catch(() => setError('Could not load evidence from server.'));
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(1);
  }

  function handleCopyHash(e, hash, id) {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Editorial Header */}
      <Reveal delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <span className="meta-label">REGISTRY</span>
            <h1 className="display-heading">Evidence archive</h1>
            <p className="display-subtext">Cryptographically indexed digital evidence and chain of custody files.</p>
          </div>
          {canUpload && (
            <Link className="btn btn-primary" to="/evidence/upload">
              <Upload size={15} /> Upload Record
            </Link>
          )}
        </div>
      </Reveal>

      {/* Filter Bar */}
      <Reveal delay={100}>
        <form className="filters-bar" onSubmit={handleSearchSubmit}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <input
              placeholder="Search filename or SHA-256 hash…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 38 }}
            />
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Review Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button className="btn btn-secondary" type="submit">
            Search
          </button>
        </form>
      </Reveal>

      {error && <ErrorState message={error} />}
      {!error && !items && <LoadingState label="Loading evidence registry…" />}
      {items && items.length === 0 && <EmptyState label="No evidence items found." />}

      {items && items.length > 0 && (
        <Reveal delay={150}>
          <div className="panel" style={{ padding: '8px 16px' }}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Filename & Specs</th>
                    <th>SHA-256 Hash Digest</th>
                    <th>Case #</th>
                    <th>Status</th>
                    <th>Uploader</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e._id} className="table-row-link" onClick={() => navigate(`/evidence/${e._id}`)}>
                      <td>
                        <div style={{ fontWeight: 500, color: '#fff', fontSize: 13.5 }}>{e.originalFilename}</div>
                        <div className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          {(e.fileSize / 1024).toFixed(1)} KB · {e.mimeType}
                        </div>
                      </td>
                      <td>
                        <div className="hash-pill" onClick={(evt) => handleCopyHash(evt, e.sha256, e._id)} title="Copy full SHA-256">
                          <span>{e.sha256 ? `${e.sha256.substring(0, 16)}…` : '—'}</span>
                          <button className="copy-btn">
                            {copiedId === e._id ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {e.case?.caseNumber ? e.case.caseNumber : <span className="muted">—</span>}
                      </td>
                      <td>
                        <Badge value={e.status} />
                      </td>
                      <td style={{ fontSize: 13 }}>{e.uploadedBy?.name || 'Unknown'}</td>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} className="muted">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" title="View Evidence Detail">
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
    </div>
  );
}
