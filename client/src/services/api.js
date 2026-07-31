import axios from 'axios'

/**
 * Centralised Axios instance — all requests go through /api proxy
 * (Vite dev proxy maps /api → http://localhost:5000)
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 60_000,          // 60 s — AI calls can be slow
  headers: { 'Content-Type': 'application/json' },
})

/* ── Local Jira Credentials Storage Helpers ───────────────── */
export function getLocalJiraConfig() {
  try {
    const raw = localStorage.getItem('ai_qa_jira_config')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocalJiraConfig(config) {
  try {
    if (config) {
      localStorage.setItem('ai_qa_jira_config', JSON.stringify({ ...config, connected: true }))
    } else {
      localStorage.removeItem('ai_qa_jira_config')
    }
  } catch (_e) {}
}

export function removeLocalJiraConfig() {
  try {
    localStorage.removeItem('ai_qa_jira_config')
  } catch (_e) {}
}

/* ── Request interceptor: Attach JWT token & Jira headers if stored ───── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ai_qa_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const localJira = getLocalJiraConfig()
    if (localJira && localJira.jiraBaseUrl && localJira.jiraEmail && localJira.jiraApiToken) {
      config.headers['X-Jira-Base-Url']  = localJira.jiraBaseUrl
      config.headers['X-Jira-Email']     = localJira.jiraEmail
      config.headers['X-Jira-Api-Token'] = localJira.jiraApiToken
    }
    return config
  },
  (error) => Promise.reject(error),
)

/* ── Response interceptor ───────────────────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.message || error.message || 'Something went wrong. Please try again.'

    if (error.response?.status === 502 || error.code === 'ECONNREFUSED') {
      message = 'Backend server is temporarily restarting or unavailable. Please try again in a moment.'
    }

    return Promise.reject(new Error(message))
  },
)

/* ─────────────────────────────────────────────────────────
   API Methods
───────────────────────────────────────────────────────── */

/** Auth APIs */
export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function updateUserProfile(payload) {
  const { data } = await api.put('/auth/profile', payload)
  return data
}

export async function updateUserPassword(payload) {
  const { data } = await api.put('/auth/password', payload)
  return data
}

export async function getDashboardStats() {
  const { data } = await api.get('/auth/dashboard-stats')
  return data
}

/** History APIs */
export function getUserHistoryCache(userId) {
  try {
    const key = userId ? `ai_qa_user_history_${userId}` : 'ai_qa_user_history_last'
    const raw = localStorage.getItem(key) || localStorage.getItem('ai_qa_user_history_last')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveUserHistoryCache(userId, history) {
  try {
    if (Array.isArray(history)) {
      const serialized = JSON.stringify(history)
      if (userId) localStorage.setItem(`ai_qa_user_history_${userId}`, serialized)
      localStorage.setItem('ai_qa_user_history_last', serialized)
    }
  } catch (_e) {}
}

export async function getUserHistory(userId) {
  try {
    const { data } = await api.get('/history')
    if (data && Array.isArray(data.history)) {
      saveUserHistoryCache(userId, data.history)
    }
    return data
  } catch (err) {
    const cached = getUserHistoryCache(userId)
    if (cached.length > 0) {
      return { status: 'ok', history: cached, isCached: true }
    }
    throw err
  }
}

export async function syncGuestHistory(guestItems) {
  if (!Array.isArray(guestItems) || guestItems.length === 0) return { count: 0 }
  const { data } = await api.post('/history/sync-guest', { items: guestItems })
  return data
}

export async function deleteHistoryItem(id, userId) {
  const { data } = await api.delete(`/history/${id}`)
  // Remove from local cache as well
  const cached = getUserHistoryCache(userId)
  const updated = cached.filter(h => h.id !== id && h._id !== id)
  saveUserHistoryCache(userId, updated)
  return data
}

/** Bug Report Generator API */
export async function generateBugReport(payload) {
  const { data } = await api.post('/bug-report/generate', payload)
  return data
}

/** AI Duplicate Detection API */
export async function checkDuplicateBugs(payload) {
  const { data } = await api.post('/bug-report/check-duplicates', payload)
  return data
}

/** Test Case Generator APIs */
export async function generateTestCases(payload) {
  const { data } = await api.post('/generate', payload)
  return data
}

export async function getProviders() {
  const { data } = await api.get('/generate/providers')
  return data
}

export async function checkHealth() {
  const { data } = await api.get('/health')
  return data
}

/* ── Jira Config APIs ──────────────────────────────────── */
export async function getJiraConfig() {
  try {
    const { data } = await api.get('/jira/config')
    if (data?.config?.connected) {
      const local = getLocalJiraConfig() || {}
      saveLocalJiraConfig({
        jiraBaseUrl:  data.config.jiraBaseUrl,
        jiraEmail:    data.config.jiraEmail,
        jiraApiToken: local.jiraApiToken || '',
        connected:    true,
      })
      return data
    }
  } catch (_err) {
    /* ignore network / auth error and check local fallback */
  }

  const local = getLocalJiraConfig()
  if (local && local.connected && local.jiraBaseUrl && local.jiraEmail) {
    return {
      status: 'ok',
      config: {
        jiraBaseUrl:     local.jiraBaseUrl,
        jiraEmail:       local.jiraEmail,
        connected:       true,
        isLocalFallback: true,
      },
    }
  }

  return { status: 'ok', config: null }
}

export async function saveJiraConfig(payload) {
  saveLocalJiraConfig(payload)
  try {
    const { data } = await api.post('/jira/config', payload)
    return data
  } catch (err) {
    const local = getLocalJiraConfig()
    if (local) {
      return {
        status:  'ok',
        config:  { jiraBaseUrl: local.jiraBaseUrl, jiraEmail: local.jiraEmail, connected: true },
        message: 'Jira connected successfully.',
      }
    }
    throw err
  }
}

export async function deleteJiraConfig() {
  removeLocalJiraConfig()
  try {
    const { data } = await api.delete('/jira/config')
    return data
  } catch (_err) {
    return { status: 'ok', message: 'Jira disconnected.' }
  }
}

/* ── Jira Watchlist APIs ───────────────────────────────── */
export function getWatchlistCache(userId) {
  try {
    const key = userId ? `ai_qa_watchlist_${userId}` : 'ai_qa_watchlist_guest'
    const raw = localStorage.getItem(key) || localStorage.getItem('ai_qa_watchlist_guest')
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(w => !w.isReleased) : []
  } catch {
    return []
  }
}

export function saveWatchlistCache(userId, watchlist) {
  try {
    if (Array.isArray(watchlist)) {
      const serialized = JSON.stringify(watchlist)
      if (userId) localStorage.setItem(`ai_qa_watchlist_${userId}`, serialized)
      localStorage.setItem('ai_qa_watchlist_guest', serialized)
    }
  } catch (_e) {}
}

export async function getWatchlist(userId) {
  try {
    const { data } = await api.get('/jira/watchlist')
    if (data && Array.isArray(data.watchlist)) {
      saveWatchlistCache(userId, data.watchlist)
    }
    return data
  } catch (err) {
    const cached = getWatchlistCache(userId)
    if (cached.length > 0) {
      return { status: 'ok', watchlist: cached, isCached: true }
    }
    throw err
  }
}

export async function syncGuestWatchlist() {
  try {
    const { data } = await api.post('/jira/watchlist/sync-guest')
    return data
  } catch (_e) {
    return { status: 'ok', count: 0 }
  }
}

export async function syncWatchlist() {
  const { data } = await api.post('/jira/watchlist/sync')
  return data
}

export async function addToWatchlist(payload) {
  const { data } = await api.post('/jira/watchlist', payload)
  return data
}

export async function removeFromWatchlist(id) {
  const { data } = await api.delete(`/jira/watchlist/${id}`)
  return data
}

/* ── Notification APIs ─────────────────────────────────── */
export async function getNotifications() {
  const { data } = await api.get('/notifications')
  return data
}

export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count')
  return data
}

export const getUnreadNotificationCount = getUnreadCount

export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}

/* ── Template APIs ─────────────────────────────────────── */
export async function getTemplates(type = null) {
  const { data } = await api.get('/templates', { params: type ? { type } : {} })
  return data
}

export async function createTemplate(templateData) {
  const { data } = await api.post('/templates', templateData)
  return data
}

export async function deleteTemplate(id) {
  const { data } = await api.delete(`/templates/${id}`)
  return data
}

/* ── Admin User Access APIs ────────────────────────────── */
export async function getAdminUsers() {
  const { data } = await api.get('/admin/users')
  return data
}

export async function updateUserRole(userId, role) {
  const { data } = await api.put(`/admin/users/${userId}/role`, { role })
  return data
}

export default api
