import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()

  // Full notifications history list
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)

  // Active floating on-screen popup toasts
  const [toasts, setToasts]               = useState([])

  /** Add a floating popup toast to the screen */
  const addToast = useCallback(({ type = 'info', title, message, jiraTicketId, jiraBaseUrl, duration = 6000 }) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
    const newToast = { id, type, title, message, jiraTicketId, jiraBaseUrl, duration }

    setToasts(prev => [newToast, ...prev].slice(0, 5)) // max 5 active toasts on screen
    return id
  }, [])

  /** Remove a popup toast by ID */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  /** Fetch notifications & sync unread count from server */
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    try {
      const [listRes, countRes] = await Promise.allSettled([
        getNotifications(),
        getUnreadCount(),
      ])

      if (listRes.status === 'fulfilled') {
        const fetched = listRes.value.notifications || []

        // Detect newly arrived unread notifications to spawn toasts
        setNotifications(prev => {
          if (prev.length > 0) {
            const prevIds = new Set(prev.map(n => n.id || n._id))
            const newUnread = fetched.filter(n => !n.read && !prevIds.has(n.id || n._id))

            newUnread.forEach(n => {
              addToast({
                type:         n.type === 'mr-merged' ? 'success' : 'info',
                title:        n.title,
                message:      n.message,
                jiraTicketId: n.jiraTicketId,
                jiraBaseUrl:  n.jiraBaseUrl,
              })
            })
          }
          return fetched
        })
      }

      if (countRes.status === 'fulfilled') {
        setUnreadCount(countRes.value.unreadCount || 0)
      }
    } catch (err) {
      console.warn('Failed to sync notifications:', err)
    }
  }, [isAuthenticated, addToast])

  /** Periodically poll backend for new notifications every 20 seconds */
  useEffect(() => {
    if (!isAuthenticated) return

    refreshNotifications()
    const timer = setInterval(refreshNotifications, 20_000)
    return () => clearInterval(timer)
  }, [isAuthenticated, refreshNotifications])

  /** Mark a single notification as read */
  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.warn('Failed to mark as read:', err)
    }
  }

  /** Mark all notifications as read */
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.warn('Failed to mark all as read:', err)
    }
  }

  const value = {
    notifications,
    unreadCount,
    toasts,
    addToast,
    removeToast,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext
