import { useEffect } from 'react'
import { useNotification } from '../context/NotificationContext'

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast.duration) return
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, toast.duration)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  const typeStyles = {
    success: { border: 'rgba(34,197,94,0.4)',  glow: 'rgba(34,197,94,0.25)',  badge: '✅ Ready for QA', badgeBg: 'rgba(34,197,94,0.15)', badgeText: '#4ade80' },
    warning: { border: 'rgba(245,158,11,0.4)', badge: '⚠️ Alert',             badgeBg: 'rgba(245,158,11,0.15)', badgeText: '#fbbf24' },
    error:   { border: 'rgba(239,68,68,0.4)',  badge: '❌ Error',             badgeBg: 'rgba(239,68,68,0.15)',  badgeText: '#f87171' },
    info:    { border: 'rgba(99,102,241,0.4)',  badge: '🔔 Notification',      badgeBg: 'rgba(99,102,241,0.15)', badgeText: '#818cf8' },
  }

  const style = typeStyles[toast.type] || typeStyles.info

  return (
    <div
      style={{
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        padding: '1rem 1.25rem',
        borderRadius: '1rem',
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${style.border}`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.15)',
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        animation: 'toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Toast Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{
          padding: '0.2rem 0.6rem', borderRadius: '9999px',
          background: style.badgeBg, color: style.badgeText,
          fontSize: '0.72rem', fontWeight: 700,
        }}>
          {style.badge}
        </span>
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Close notification"
          style={{
            background: 'none', border: 'none', color: '#64748b',
            fontSize: '1.25rem', cursor: 'pointer', padding: 0,
            lineHeight: 1, transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = '#f8fafc'}
          onMouseLeave={e => e.target.style.color = '#64748b'}
        >
          ×
        </button>
      </div>

      {/* Toast Title */}
      <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', fontWeight: 700, color: '#f1f5f9' }}>
        {toast.title}
      </h4>

      {/* Toast Message */}
      <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
        {toast.message}
      </p>

      {/* Action Link (e.g., Jira ticket link) */}
      {toast.jiraTicketId && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <a
            href={toast.jiraBaseUrl ? `${toast.jiraBaseUrl}/browse/${toast.jiraTicketId}` : '#'}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              color: '#818cf8', fontSize: '0.78rem', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            🎫 Open Jira Ticket ({toast.jiraTicketId}) →
          </a>
        </div>
      )}

      {/* Auto-dismiss progress bar */}
      {toast.duration && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: 'rgba(255,255,255,0.08)',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }} />
        </div>
      )}
    </div>
  )
}

export default function NotificationPopups() {
  const { toasts, removeToast } = useNotification()

  if (toasts.length === 0) return null

  return (
    <>
      <div
        id="notification-popups-container"
        style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          pointerEvents: 'auto',
        }}
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>

      <style>{`
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </>
  )
}
