import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

/**
 * Notification bell icon with animated unread badge.
 * Uses centralized NotificationContext store.
 */
export default function NotificationBell() {
  const { isAuthenticated } = useAuth()
  const { unreadCount }      = useNotification()
  const navigate             = useNavigate()

  if (!isAuthenticated) return null

  return (
    <button
      id="notification-bell-btn"
      onClick={() => navigate('/notifications')}
      title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
      style={{
        position: 'relative',
        width: 36, height: 36, borderRadius: '0.5rem',
        background: unreadCount > 0 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)',
        border: unreadCount > 0 ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}
    >
      {/* Bell Icon */}
      <svg
        width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={unreadCount > 0 ? '#818cf8' : '#64748b'} strokeWidth="2"
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
          boxShadow: '0 0 8px rgba(239,68,68,0.6)',
          border: '1.5px solid #0a0d14',
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
