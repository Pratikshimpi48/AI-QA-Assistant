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

/* ── Request interceptor: Attach JWT token if stored ───── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ai_qa_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/* ── Response interceptor ───────────────────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.'
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

export async function getDashboardStats() {
  const { data } = await api.get('/auth/dashboard-stats')
  return data
}

/** History APIs */
export async function getUserHistory() {
  const { data } = await api.get('/history')
  return data
}

export async function deleteHistoryItem(id) {
  const { data } = await api.delete(`/history/${id}`)
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
  const { data } = await api.get('/jira/config')
  return data
}

export async function saveJiraConfig(payload) {
  const { data } = await api.post('/jira/config', payload)
  return data
}

export async function deleteJiraConfig() {
  const { data } = await api.delete('/jira/config')
  return data
}

/* ── Jira Watchlist APIs ───────────────────────────────── */
export async function getWatchlist() {
  const { data } = await api.get('/jira/watchlist')
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

export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}

export default api
