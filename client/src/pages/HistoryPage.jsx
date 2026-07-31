import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserHistory, deleteHistoryItem, getUserHistoryCache } from '../services/api'
import Navbar from '../components/Navbar'
import ExportButton from '../components/ExportButton'
import { exportTestCases, exportBugReport } from '../utils/exportUtils'
import { getGuestHistory, deleteGuestHistoryItem } from '../utils/guestSession'

const S = {
  page:    { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:    { maxWidth: 950, margin: '0 auto', padding: '7.5rem 1.5rem 4rem' },
  badge:   {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.375rem 1rem', borderRadius: '9999px',
    background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
    color: '#22d3ee', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
  },
  heading: { fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' },
  sub:     { fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '2rem' },
  card:    {
    borderRadius: '1rem', padding: '1.5rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    marginBottom: '1rem',
  },
  filterBtn: (active) => ({
    padding: '0.4rem 1rem', borderRadius: '0.5rem',
    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
    color: active ? '#818cf8' : '#94a3b8',
    border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--color-border)',
    transition: 'all 0.2s',
  })
}

export default function HistoryPage() {
  const { user, isAuthenticated } = useAuth()
  const [history, setHistory] = useState(() => {
    if (!isAuthenticated) return getGuestHistory()
    return getUserHistoryCache(user?.id)
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const loadHistory = async () => {
    if (!isAuthenticated) {
      setHistory(getGuestHistory())
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await getUserHistory(user?.id)
      setHistory(res.history || [])
    } catch (err) {
      console.error('Failed to load user history:', err)
      const cached = getUserHistoryCache(user?.id)
      if (cached.length > 0) setHistory(cached)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [isAuthenticated, user?.id])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this history item?')) return
    if (!isAuthenticated) {
      deleteGuestHistoryItem(id)
      setHistory((prev) => prev.filter((item) => item.id !== id && item._id !== id))
      return
    }
    try {
      await deleteHistoryItem(id, user?.id)
      setHistory((prev) => prev.filter((item) => (item.id !== id && item._id !== id)))
    } catch (err) {
      alert('Failed to delete item: ' + err.message)
    }
  }

  const filteredHistory = history.filter((item) => {
    if (filter === 'test-cases') return item.type === 'test-cases'
    if (filter === 'bug-report') return item.type === 'bug-report'
    return true
  })

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>🕐 History</div>
        <h1 style={S.heading}>Generation History</h1>
        <p style={S.sub}>
          Review all your previously generated AI test cases and bug reports. All records are private and isolated to your account.
        </p>

        {!isAuthenticated && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '0.875rem', marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0.04) 100%)',
            border: '1px solid rgba(234,179,8,0.3)', color: '#facc15',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <div>
                <strong>Guest Session Active:</strong> Temporary history is saved in this browser tab. All data will disappear when you close this window.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/register" style={{ color: '#0f172a', background: '#facc15', padding: '0.35rem 0.85rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.775rem', textDecoration: 'none' }}>
                Save Permanently
              </Link>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button style={S.filterBtn(filter === 'all')} onClick={() => setFilter('all')}>
            All Activity ({history.length})
          </button>
          <button style={S.filterBtn(filter === 'test-cases')} onClick={() => setFilter('test-cases')}>
            🧪 Test Cases ({history.filter(h => h.type === 'test-cases').length})
          </button>
          <button style={S.filterBtn(filter === 'bug-report')} onClick={() => setFilter('bug-report')}>
            🐛 Bug Reports ({history.filter(h => h.type === 'bug-report').length})
          </button>
        </div>

            {/* History List */}
            {loading ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '3rem 1.5rem' }}>
                <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Loading your history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '3rem 1.5rem' }}>
                <svg style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} width="48" height="48"
                  viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                  📭 No matching history records found. Generate test cases or bug reports to build your history!
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  <Link to="/" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                    🧪 Generate Test Cases
                  </Link>
                  <Link to="/bug-report" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                    🐛 Generate Bug Report
                  </Link>
                </div>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const itemId = item.id || item._id
                const isExpanded = expandedId === itemId
                return (
                  <div key={itemId} style={S.card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>
                          {item.type === 'bug-report' ? '🐛' : '🧪'}
                        </span>
                        <div>
                          <h3 style={{ color: 'var(--color-text)', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                            {item.title}
                          </h3>
                          <p style={{ color: 'var(--color-text-muted)', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                            {item.type === 'bug-report' ? 'Bug Report' : `Test Suite (${Array.isArray(item.data) ? item.data.length : 0} Cases)`} • Generated {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <ExportButton
                          label="Export"
                          onExport={(format) => {
                            if (item.type === 'bug-report') {
                              exportBugReport(item.data, format, `Bug_Report_${item.title.replace(/\s+/g, '_')}`)
                            } else {
                              exportTestCases(item.data, format, `Test_Cases_${item.title.replace(/\s+/g, '_')}`)
                            }
                          }}
                        />
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : itemId)}
                          style={{
                            padding: '0.4rem 0.85rem', borderRadius: '0.5rem',
                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => handleDelete(itemId)}
                          style={{
                            padding: '0.4rem 0.85rem', borderRadius: '0.5rem',
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Expanded content view */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        {item.type === 'bug-report' ? (
                          <div style={{
                            background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem',
                            color: 'var(--color-text)', fontSize: '0.875rem', lineHeight: 1.6, textAlign: 'left',
                          }}>
                            <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>
                              [{item.data.severity || 'Medium'}] {item.data.title}
                            </div>
                            <p style={{ margin: '0 0 0.5rem' }}><strong>Summary:</strong> {item.data.summary}</p>
                            <p style={{ margin: '0 0 0.5rem' }}><strong>Expected:</strong> {item.data.expectedBehavior}</p>
                            <p style={{ margin: '0 0 0.5rem' }}><strong>Actual:</strong> {item.data.actualBehavior}</p>
                            {Array.isArray(item.data.stepsToReproduce) && (
                              <div>
                                <strong>Steps to Reproduce:</strong>
                                <ol style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                                  {item.data.stepsToReproduce.map((step, sIdx) => (
                                    <li key={sIdx}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)',
                            padding: '1rem', borderRadius: '0.5rem', textAlign: 'left',
                          }}>
                            {Array.isArray(item.data) && item.data.map((tc, idx) => (
                              <div key={idx} style={{
                                padding: '0.5rem 0', borderBottom: idx < item.data.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              }}>
                                <span style={{ fontWeight: 700, color: '#818cf8', marginRight: '0.5rem' }}>{tc.id || `TC-${idx+1}`}</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{tc.title}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                  Type: {tc.type} • Priority: {tc.priority} • Expected: {tc.expected}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
      </div>
    </div>
  )
}
