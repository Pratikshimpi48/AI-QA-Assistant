import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

function getNotificationBadge(type) {
  if (type === 'ticket-released') return { icon: '🚀', bg: 'rgba(168,85,247,0.18)' }
  if (type === 'mr-merged')       return { icon: '🧪', bg: 'rgba(34,197,94,0.18)' }
  if (type === 'status-changed')   return { icon: '🔄', bg: 'rgba(59,130,246,0.18)' }
  return { icon: '🔔', bg: 'rgba(99,102,241,0.18)' }
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/**
 * Notification bell icon with toggleable dropdown popover menu.
 */
export default function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification()
  const navigate = useNavigate()

  const [popoverOpen, setPopoverOpen] = useState(false)
  const containerRef = useRef(null)

  // Auto-close popover on click outside or Escape key press
  useEffect(() => {
    if (!popoverOpen) return

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setPopoverOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPopoverOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [popoverOpen])

  if (!isAuthenticated) return null

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Keyframes for Glowing Bell & Pulsing Badge */}
      <style>{`
        @keyframes bell-pulse-glow {
          0% {
            box-shadow: 0 0 8px rgba(99,102,241,0.4), 0 0 2px rgba(99,102,241,0.2);
            border-color: rgba(99,102,241,0.4);
          }
          50% {
            box-shadow: 0 0 20px rgba(99,102,241,0.85), 0 0 10px rgba(99,102,241,0.5);
            border-color: rgba(129,140,248,0.9);
          }
          100% {
            box-shadow: 0 0 8px rgba(99,102,241,0.4), 0 0 2px rgba(99,102,241,0.2);
            border-color: rgba(99,102,241,0.4);
          }
        }
        @keyframes badge-pulse-scale {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setPopoverOpen(prev => !prev)}
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
        style={{
          position: 'relative',
          width: 36, height: 36, borderRadius: '0.5rem',
          background: popoverOpen
            ? 'rgba(99,102,241,0.25)'
            : (unreadCount > 0 ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)'),
          border: popoverOpen
            ? '1px solid rgba(99,102,241,0.6)'
            : (unreadCount > 0 ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)'),
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.25s ease',
          animation: unreadCount > 0 && !popoverOpen ? 'bell-pulse-glow 2s infinite ease-in-out' : 'none',
          boxShadow: popoverOpen
            ? '0 0 16px rgba(99,102,241,0.5)'
            : (unreadCount > 0 ? '0 0 12px rgba(99,102,241,0.5)' : 'none'),
        }}
      >
        {/* Bell Icon */}
        <svg
          width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke={popoverOpen || unreadCount > 0 ? '#818cf8' : '#64748b'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 17, height: 17,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderRadius: '9999px',
            fontSize: '0.6rem', fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 10px rgba(239,68,68,0.85), 0 0 4px rgba(239,68,68,0.5)',
            border: '1.5px solid #0a0d14',
            animation: 'badge-pulse-scale 2s infinite ease-in-out',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Toggleable Dropdown Popover */}
      {popoverOpen && (
        <div
          id="notification-popover-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 'min(380px, 90vw)',
            maxHeight: '480px',
            background: 'var(--color-surface)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--color-border)',
            borderRadius: '1rem',
            boxShadow: '0 20px 45px var(--color-shadow)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Popover Header */}
          <div style={{
            padding: '0.9rem 1.15rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: '9999px',
                  background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                  color: '#818cf8', fontSize: '0.68rem', fontWeight: 700,
                }}>
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none', border: 'none', color: '#818cf8',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  padding: '0.2rem 0.4rem', borderRadius: '0.375rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                ✓ Mark all read
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>No notifications yet</div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                  Watch Jira tickets to receive status change updates here.
                </div>
              </div>
            ) : (
              notifications.map(notif => {
                const id = notif._id || notif.id
                const badge = getNotificationBadge(notif.type)
                return (
                  <div
                    key={id}
                    onClick={() => !notif.read && markAsRead(id)}
                    style={{
                      padding: '0.85rem 0.95rem',
                      borderRadius: '0.75rem',
                      marginBottom: '0.35rem',
                      background: notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                      border: notif.read ? '1px solid transparent' : '1px solid rgba(99, 102, 241, 0.2)',
                      cursor: notif.read ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    }}
                  >
                    {/* Icon Badge */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '0.5rem', flexShrink: 0,
                      background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>
                      {badge.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.82rem', fontWeight: notif.read ? 600 : 700,
                          color: notif.read ? '#cbd5e1' : '#ffffff',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', flexShrink: 0 }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '0.75rem', color: '#94a3b8', margin: '0.2rem 0 0.4rem',
                        lineHeight: 1.4, wordBreak: 'break-word',
                      }}>
                        {notif.message}
                      </p>

                      {notif.jiraTicketId && notif.jiraBaseUrl && (
                        <a
                          href={`${notif.jiraBaseUrl}/browse/${notif.jiraTicketId}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            fontSize: '0.7rem', fontWeight: 600, color: '#818cf8',
                            textDecoration: 'none', padding: '0.15rem 0.45rem',
                            borderRadius: '0.25rem', background: 'rgba(99,102,241,0.12)',
                          }}
                        >
                          🎫 Open {notif.jiraTicketId} →
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Popover Footer */}
          <div style={{
            padding: '0.65rem 1rem',
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}>
            <button
              onClick={() => { setPopoverOpen(false); navigate('/notifications'); }}
              style={{
                background: 'none', border: 'none', color: '#818cf8',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              <span>View Full Notification Center</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
