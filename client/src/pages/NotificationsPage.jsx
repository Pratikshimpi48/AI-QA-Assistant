import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins} minute${mins > 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function getNotificationBadge(type) {
  if (type === 'ticket-released') return { icon: '🚀', bg: 'rgba(168,85,247,0.15)', color: '#c084fc' }
  if (type === 'mr-merged')       return { icon: '🧪', bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' }
  if (type === 'status-changed')   return { icon: '🔄', bg: 'rgba(59,130,246,0.15)',   color: '#60a5fa' }
  return { icon: '🔔', bg: 'rgba(99,102,241,0.15)', color: '#818cf8' }
}

export default function NotificationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [pageLoading, setPageLoading]     = useState(true)
  const [markingAll, setMarkingAll]       = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getNotifications()
      setNotifications(res.notifications || [])
    } catch { /* silently fail */ }
    finally { setPageLoading(false) }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { navigate('/login'); return }
    if (!authLoading) loadNotifications()
  }, [isAuthenticated, authLoading, loadNotifications, navigate])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev => prev.map(n => (n._id || n.id) === id ? { ...n, read: true } : n))
    } catch { /* ignore */ }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* ignore */ }
    finally { setMarkingAll(false) }
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

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '8rem 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.9rem', borderRadius: '9999px',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
              color: '#818cf8', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.875rem',
            }}>
              🔔 Notification Center
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.4rem' }}>
              Notifications
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              {notifications.length === 0
                ? 'No notifications yet.'
                : `${notifications.length} notification${notifications.length > 1 ? 's' : ''} — ${unreadCount} unread`}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              id="mark-all-read-btn"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.82rem', fontWeight: 600,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', cursor: markingAll ? 'not-allowed' : 'pointer',
                opacity: markingAll ? 0.6 : 1, alignSelf: 'flex-start',
              }}
            >
              {markingAll ? 'Marking...' : '✓ Mark all as read'}
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div style={{
            padding: '4rem 2rem', borderRadius: '1.25rem', textAlign: 'center',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔔</div>
            <h3 style={{ color: '#475569', fontWeight: 600, margin: '0 0 0.5rem' }}>No notifications yet</h3>
            <p style={{ color: '#334155', fontSize: '0.875rem', maxWidth: 360, margin: '0 auto', lineHeight: 1.7 }}>
              Add Jira tickets to your watchlist. You'll be notified here whenever a ticket status changes in Jira.
            </p>
            <button
              onClick={() => navigate('/jira-watchlist')}
              style={{
                marginTop: '1.5rem', padding: '0.65rem 1.5rem', borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              🎫 Go to Jira Watchlist
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map(notif => {
              const id = notif._id || notif.id
              const badge = getNotificationBadge(notif.type)
              return (
                <div
                  key={id}
                  id={`notification-${id}`}
                  onClick={() => !notif.read && handleMarkRead(id)}
                  style={{
                    padding: '1.15rem 1.4rem',
                    borderRadius: '1rem',
                    background: notif.read ? 'var(--color-surface)' : 'rgba(99,102,241,0.06)',
                    border: notif.read
                      ? '1px solid var(--color-border)'
                      : '1px solid rgba(99,102,241,0.25)',
                    borderLeft: notif.read ? undefined : '3px solid #6366f1',
                    cursor: notif.read ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '0.75rem', flexShrink: 0,
                    background: badge.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  }}>
                    {badge.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h3 style={{
                        margin: 0, fontSize: '0.9rem', fontWeight: notif.read ? 500 : 700,
                        color: notif.read ? '#94a3b8' : '#f1f5f9', lineHeight: 1.4,
                      }}>
                        {notif.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {!notif.read && (
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: '#6366f1', flexShrink: 0,
                            boxShadow: '0 0 6px rgba(99,102,241,0.6)',
                          }} />
                        )}
                        <span style={{ fontSize: '0.72rem', color: '#334155' }}>{timeAgo(notif.createdAt)}</span>
                      </div>
                    </div>

                    <p style={{ margin: '0.35rem 0 0.5rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                      {notif.message}
                    </p>

                    {notif.jiraTicketId && notif.jiraBaseUrl && (
                      <a
                        href={`${notif.jiraBaseUrl}/browse/${notif.jiraTicketId}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          fontSize: '0.78rem', fontWeight: 600, color: '#6366f1',
                          textDecoration: 'none', padding: '0.25rem 0.625rem',
                          borderRadius: '0.375rem', background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.2)',
                        }}
                      >
                        🎫 Open {notif.jiraTicketId} in Jira →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
