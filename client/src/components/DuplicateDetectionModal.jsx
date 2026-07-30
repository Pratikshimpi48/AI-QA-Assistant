import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Modal to display AI-detected duplicate bug reports.
 * Shown when similarity >= 30% found before creating a new bug report.
 */
export default function DuplicateDetectionModal({ duplicates = [], totalChecked = 0, onIgnore, onCancel, loading = false }) {
  const navigate = useNavigate()

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  const getSimilarityColor = (score) => {
    if (score >= 80) return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171' }
    if (score >= 50) return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24' }
    return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#4ade80' }
  }

  const getSimilarityLabel = (score) => {
    if (score >= 80) return 'High Match'
    if (score >= 50) return 'Partial Match'
    return 'Low Match'
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        width: '100%', maxWidth: 680,
        background: 'linear-gradient(145deg, #0f1117 0%, #161b27 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '1.25rem',
        boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
        overflow: 'hidden',
        animation: 'fadeInUp 0.25s ease',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: loading ? 'rgba(99,102,241,0.05)' : 'rgba(245,158,11,0.05)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '0.75rem',
                background: loading ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', flexShrink: 0,
              }}>
                {loading ? '🔍' : '⚠️'}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>
                  {loading ? 'Scanning for Duplicates...' : duplicates.length === 0 ? 'No Duplicates Found' : `${duplicates.length} Similar Bug${duplicates.length > 1 ? 's' : ''} Found`}
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {loading
                    ? 'AI is comparing your bug against existing reports...'
                    : duplicates.length === 0
                      ? `Checked against ${totalChecked} existing bug report${totalChecked !== 1 ? 's' : ''}. No similar issues found.`
                      : `Checked ${totalChecked} existing report${totalChecked !== 1 ? 's' : ''}. Review before creating a new ticket.`}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#64748b', cursor: 'pointer', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{
                width: 52, height: 52, margin: '0 auto 1rem',
                borderRadius: '50%',
                border: '3px solid rgba(99,102,241,0.2)',
                borderTopColor: '#6366f1',
                animation: 'spin-slow 0.9s linear infinite',
              }} />
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Analyzing similarity using AI...</p>
            </div>
          )}

          {!loading && duplicates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
              <p style={{ color: '#4ade80', fontSize: '0.95rem', fontWeight: 600 }}>No duplicates detected!</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>Your bug report appears to be unique. You can safely create it.</p>
            </div>
          )}

          {!loading && duplicates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {duplicates.map((dup) => {
                const colors = getSimilarityColor(dup.similarity)
                return (
                  <div
                    key={dup.id}
                    style={{
                      padding: '1rem 1.15rem',
                      borderRadius: '0.875rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${colors.border}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '9999px',
                            background: colors.bg, border: `1px solid ${colors.border}`,
                            color: colors.text, fontSize: '0.7rem', fontWeight: 700,
                          }}>
                            {dup.similarity}% — {getSimilarityLabel(dup.similarity)}
                          </span>
                          {dup.severity && dup.severity !== 'Unknown' && (
                            <span style={{ color: '#475569', fontSize: '0.7rem' }}>
                              {dup.severity} Severity
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dup.title}
                        </p>
                        {dup.summary && (
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {dup.summary}
                          </p>
                        )}
                        {dup.reason && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#6366f1', fontStyle: 'italic' }}>
                            💡 {dup.reason}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => { navigate('/history'); onCancel() }}
                        style={{
                          padding: '0.35rem 0.75rem', borderRadius: '0.5rem', flexShrink: 0,
                          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                          color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}
                      >
                        Open Issue →
                      </button>
                    </div>
                    {dup.createdAt && (
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#334155' }}>
                        Reported: {new Date(dup.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && (
          <div style={{
            padding: '1.15rem 1.75rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', flex: 1 }}>
              {duplicates.length > 0
                ? '⚠️ Please verify these are not the same defect before creating a new ticket.'
                : '✅ Safe to proceed — your bug report is unique.'}
            </p>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                id="duplicate-modal-create-anyway-btn"
                onClick={onIgnore}
                style={{
                  padding: '0.6rem 1.35rem', borderRadius: '0.5rem',
                  background: duplicates.length > 0
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff', fontSize: '0.85rem', fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  boxShadow: duplicates.length > 0 ? '0 4px 14px rgba(245,158,11,0.35)' : '0 4px 14px rgba(34,197,94,0.35)',
                }}
              >
                {duplicates.length > 0 ? '⚡ Ignore & Create Anyway' : '✅ Create Bug Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
