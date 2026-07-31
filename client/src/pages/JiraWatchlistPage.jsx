import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getWatchlist, syncWatchlist, addToWatchlist, removeFromWatchlist, getJiraConfig, getWatchlistCache } from '../services/api'

function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_STYLES = {
  'To Be Released':          { bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)', text: '#c084fc', icon: '🚀' },
  'Released':                { bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)', text: '#c084fc', icon: '🚀' },
  'Closed':                  { bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)', text: '#c084fc', icon: '🚀' },
  'Released to Production': { bg: 'rgba(168,85,247,0.18)', border: 'rgba(168,85,247,0.45)', text: '#c084fc', icon: '🚀' },
  'Ready for QA':            { bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.4)',   text: '#4ade80', icon: '🧪' },
  'In QA':                   { bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.4)',   text: '#4ade80', icon: '🧪' },
  'Done':                    { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  text: '#818cf8', icon: '✅' },
  'Resolved':                { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  text: '#818cf8', icon: '✅' },
  'Merged':                  { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  text: '#818cf8', icon: '🔀' },
  'In Progress':             { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  text: '#fbbf24', icon: '⚡' },
  'Open':                    { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', text: '#64748b', icon: '⚪' },
  'Unknown':                 { bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.2)', text: '#475569', icon: '❓' },
}

function getStatusStyle(status) {
  if (!status) return STATUS_STYLES['Unknown']
  const normalized = Object.keys(STATUS_STYLES).find(k => k.toLowerCase() === status.toLowerCase())
  if (normalized) return STATUS_STYLES[normalized]

  const lower = status.toLowerCase()
  if (lower.includes('release') || lower.includes('closed') || lower.includes('prod')) {
    return STATUS_STYLES['To Be Released']
  }
  if (lower.includes('qa')) return STATUS_STYLES['Ready for QA']
  if (lower.includes('progress')) return STATUS_STYLES['In Progress']
  return STATUS_STYLES['Unknown']
}

/** Client-side Jira ticket ID format check */
function isValidFormat(id) {
  return /^[A-Za-z][A-Za-z0-9]+-\d+$/.test((id || '').trim())
}

export default function JiraWatchlistPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [watchlist, setWatchlist]   = useState(() => getWatchlistCache(user?.id))
  const [jiraConfig, setJiraConfig] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)

  // Add ticket form state
  const [ticketInput, setTicketInput] = useState('')
  const [adding, setAdding]           = useState(false)
  const [addError, setAddError]       = useState('')
  const [addSuccess, setAddSuccess]   = useState('')

  // Remove state
  const [removing, setRemoving] = useState(null)

  const [syncing, setSyncing]       = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncWatchlist()
      if (res.watchlist) setWatchlist(res.watchlist)
    } catch (err) {
      alert(`Sync failed: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const loadData = useCallback(async () => {
    try {
      const [wlRes, cfgRes] = await Promise.allSettled([getWatchlist(user?.id), getJiraConfig()])
      if (wlRes.status  === 'fulfilled') setWatchlist(wlRes.value.watchlist || [])
      if (cfgRes.status === 'fulfilled') setJiraConfig(cfgRes.value.config)
    } catch {
      const cached = getWatchlistCache(user?.id)
      if (cached.length > 0) setWatchlist(cached)
    }
    finally { setPageLoading(false) }
  }, [user?.id])

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading, loadData])

  /**
   * Validate format client-side, then call backend which validates against live Jira.
   * Backend returns specific error messages for: not found, auth error, duplicate, bad format.
   */
  const handleAdd = async (e) => {
    e.preventDefault()
    const ticket = ticketInput.trim().toUpperCase()
    if (!ticket) return

    // Step 1: client-side format check (instant, no API call)
    if (!isValidFormat(ticket)) {
      setAddError(`"${ticket}" is not a valid Jira ticket ID. Use the format PROJECT-123 (e.g. QA-145, BUG-32).`)
      return
    }

    setAddError('')
    setAddSuccess('')
    setAdding(true)

    try {
      // Step 2: backend validates against live Jira — returns clear error if ticket doesn't exist
      const res = await addToWatchlist({ jiraTicketId: ticket })
      setWatchlist(prev => [res.item, ...prev])
      setTicketInput('')
      setAddSuccess(`✅ ${ticket} verified & added! Current status: "${res.item?.currentStatus || 'Unknown'}"`)
      setTimeout(() => setAddSuccess(''), 5000)
    } catch (err) {
      // Backend returns specific messages — display them directly
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id, ticketId) => {
    if (!window.confirm(`Remove ${ticketId} from your watchlist?`)) return
    setRemoving(id)
    try {
      await removeFromWatchlist(id)
      setWatchlist(prev => prev.filter(w => (w._id || w.id) !== id))
    } catch (err) {
      alert(`Failed to remove: ${err.message}`)
    } finally {
      setRemoving(null)
    }
  }

  if (authLoading || pageLoading) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1',
            animation: 'spin-slow 0.8s linear infinite',
          }} />
        </div>
      </div>
    )
  }

  const inputBorderColor = addError
    ? 'rgba(239,68,68,0.5)'
    : addSuccess
      ? 'rgba(34,197,94,0.4)'
      : 'rgba(255,255,255,0.1)'

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8rem 1.5rem 4rem' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 1rem', borderRadius: '9999px',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
              color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.25rem',
            }}>
              🎫 Jira Watchlist
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
              Jira MR Watchlist
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.7, margin: 0, maxWidth: 650 }}>
              Add Jira ticket IDs to monitor. You'll receive a notification in your{' '}
              <strong style={{ color: '#818cf8' }}>Notification Center</strong> as soon as the ticket status
              changes to <em>Ready for QA</em> or <em>Done</em>.
            </p>
          </div>

          {jiraConfig?.connected && watchlist.length > 0 && (
            <button
              id="sync-watchlist-btn"
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.82rem', fontWeight: 600,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
                alignSelf: 'flex-start', marginTop: '1.5rem',
              }}
            >
              <span style={{ display: 'inline-block', transform: syncing ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s ease' }}>🔄</span>
              {syncing ? 'Syncing Jira...' : 'Sync Watchlist'}
            </button>
          )}
        </div>

        {/* Jira not connected warning */}
        {!jiraConfig?.connected && (
          <div style={{
            marginBottom: '2rem', padding: '1rem 1.25rem', borderRadius: '0.875rem',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#fbbf24', fontSize: '0.9rem' }}>Jira not connected</p>
                <p style={{ margin: '0.1rem 0 0', color: '#78716c', fontSize: '0.8rem' }}>
                  Connect your Jira account in Settings before adding tickets to the watchlist.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings')}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700,
                background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
                color: '#fbbf24', cursor: 'pointer',
              }}
            >
              ⚙️ Go to Settings
            </button>
          </div>
        )}

        {/* Add Ticket Form */}
        {jiraConfig?.connected && (
          <div style={{
            marginBottom: '2rem', padding: '1.5rem',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '1rem',
          }}>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
              ➕ Add Ticket to Watchlist
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#475569' }}>
              Enter a valid Jira ticket ID. The system will verify it exists in your Jira board before adding.
            </p>

            <form onSubmit={handleAdd}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
                  <input
                    id="watchlist-ticket-input"
                    type="text"
                    placeholder="e.g. QA-145 or PROJ-232"
                    value={ticketInput}
                    onChange={e => {
                      setTicketInput(e.target.value)
                      // Clear error as user types
                      if (addError) setAddError('')
                    }}
                    disabled={adding}
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${inputBorderColor}`,
                      color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
                      boxSizing: 'border-box', transition: 'border-color 0.2s',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
                <button
                  id="watchlist-add-btn"
                  type="submit"
                  disabled={adding || !ticketInput.trim()}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 700,
                    background: adding ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff', border: 'none',
                    cursor: (adding || !ticketInput.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (adding || !ticketInput.trim()) ? 0.65 : 1,
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap',
                  }}
                >
                  {adding ? (
                    <>
                      <svg style={{ animation: 'spin-slow 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      Verifying in Jira...
                    </>
                  ) : (
                    '🔍 Verify & Add'
                  )}
                </button>
              </div>

              {/* Error Message */}
              {addError && (
                <div style={{
                  marginTop: '0.75rem', padding: '0.65rem 1rem', borderRadius: '0.5rem',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>❌</span>
                  <p style={{ margin: 0, color: '#f87171', fontSize: '0.82rem', lineHeight: 1.5 }}>{addError}</p>
                </div>
              )}

              {/* Success Message */}
              {addSuccess && (
                <div style={{
                  marginTop: '0.75rem', padding: '0.65rem 1rem', borderRadius: '0.5rem',
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <p style={{ margin: 0, color: '#4ade80', fontSize: '0.82rem', fontWeight: 500 }}>{addSuccess}</p>
                </div>
              )}
            </form>

            {/* Format hint */}
            <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#334155' }}>
                ✓ Valid formats: <code style={{ color: '#6366f1' }}>QA-145</code>, <code style={{ color: '#6366f1' }}>PROJ-1000</code>, <code style={{ color: '#6366f1' }}>BUG-32</code>
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#334155' }}>
                Jira server: <span style={{ color: '#475569' }}>{jiraConfig.jiraBaseUrl}</span>
              </p>
            </div>
          </div>
        )}

        {/* Watchlist Table */}
        {watchlist.length === 0 ? (
          <div style={{
            padding: '3.5rem 2rem', borderRadius: '1rem', textAlign: 'center',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎫</div>
            <h3 style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.4rem' }}>
              No tickets being watched
            </h3>
            <p style={{ color: '#334155', fontSize: '0.85rem', margin: 0 }}>
              Add a Jira ticket ID above to start monitoring its MR status.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '1rem', overflow: 'hidden',
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 160px 110px 80px',
              padding: '0.75rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.7rem', fontWeight: 700, color: '#475569',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              <span>Ticket ID</span>
              <span>Summary</span>
              <span>Status</span>
              <span>Last Checked</span>
              <span></span>
            </div>

            {/* Rows */}
            {watchlist.map((item, idx) => {
              const id = item._id || item.id
              const statusStyle = getStatusStyle(item.currentStatus)
              return (
                <div
                  key={id}
                  style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr 160px 110px 80px',
                    padding: '1rem 1.25rem', alignItems: 'center', gap: '0.5rem',
                    borderBottom: idx < watchlist.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div>
                    <a
                      href={item.jiraBaseUrl ? `${item.jiraBaseUrl}/browse/${item.jiraTicketId}` : '#'}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}
                    >
                      {item.jiraTicketId}
                    </a>
                  </div>
                  <div style={{
                    fontSize: '0.82rem', color: '#94a3b8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.summary || '—'}
                  </div>
                  <div>
                    <span style={{
                      padding: '0.2rem 0.65rem', borderRadius: '9999px',
                      background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
                      color: statusStyle.text, fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    }}>
                      <span>{statusStyle.icon}</span>
                      <span>{item.currentStatus || 'Unknown'}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                    {timeAgo(item.lastChecked)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleRemove(id, item.jiraTicketId)}
                      disabled={removing === id}
                      style={{
                        padding: '0.3rem 0.65rem', borderRadius: '0.375rem', fontSize: '0.75rem',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171', cursor: removing === id ? 'not-allowed' : 'pointer',
                        opacity: removing === id ? 0.5 : 1,
                      }}
                    >
                      {removing === id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: '#334155', lineHeight: 1.6 }}>
          🔄 The system polls Jira every <strong style={{ color: '#475569' }}>5 minutes</strong>.
          Notifications are sent when status changes to <em>Ready for QA, Done, Resolved</em> or <em>Merged</em>.
        </p>
      </div>
    </div>
  )
}
