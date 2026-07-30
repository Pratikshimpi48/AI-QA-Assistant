import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUnreadCount } from '../services/api'
import { useAuth } from '../context/AuthContext'

/**
 * Notification bell icon with animated unread badge.
 * Polls /api/notifications/unread-count every 60s.
 */
export default function NotificationBell() {
  const [count, setCount]       = useState(0)
  const [pulse, setPulse]       = useState(false)
  const { isAuthenticated }     = useAuth()
  const navigate                = useNavigate()
  const prevCount               = useRef(0)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchCount = async () => {
      try {
        const res = await getUnreadCount()
        const newCount = res.count || 0
        if (newCount > prevCount.current) {
          setPulse(true)
          setTimeout(() => setPulse(false), 2000)
        }
        prevCount.current = newCount
        setCount(newCount)
      } catch {
        // Silently fail — not critical
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 60_000) // poll every 60s
    return () => clearInterval(interval)
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <button
      id="notification-bell-btn"
      onClick={() => navigate('/notifications')}
      title={count > 0 ? `${count} unread notification${count > 1 ? 's' : ''}` : 'Notifications'}
      style={{
        position: 'relative',
        width: 36, height: 36, borderRadius: '0.5rem',
        background: count > 0 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)',
        border: count > 0 ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        animation: pulse ? 'pulse-glow 0.6s ease-in-out 3' : 'none',
      }}
    >
      {/* Bell Icon */}
      <svg
        width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={count > 0 ? '#818cf8' : '#64748b'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {/* Unread badge */}
      {count > 0 && (
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
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
