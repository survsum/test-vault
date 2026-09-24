import { Loader2, AlertCircle, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export function LoadingState({ label = 'Loading system data…' }) {
  return (
    <div className="state-block loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px' }}>
      <Loader2 size={32} className="spin" style={{ color: 'var(--accent-light)', animation: 'spin 1s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{label}</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function EmptyState({ label = 'No records found.' }) {
  return (
    <div className="state-block empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '50px 20px', color: 'var(--text-muted)' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Inbox size={24} style={{ opacity: 0.6 }} />
      </div>
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message = 'An unexpected error occurred.' }) {
  return (
    <div className="alert-box alert-critical" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <ChevronLeft size={16} /> Prev
      </button>
      <span>
        Page <strong style={{ color: '#fff' }}>{page}</strong> of <strong>{pages}</strong>
      </span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
