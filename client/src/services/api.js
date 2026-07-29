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

/* ── Request interceptor ────────────────────────────────── */
api.interceptors.request.use(
  (config) => config,
  (error)  => Promise.reject(error),
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

/**
 * POST /api/generate
 * Send requirements to the selected AI provider → receive structured test cases
 * @param {{
 *   requirements:  string,
 *   fileName?:     string,
 *   fileContent?:  string,
 *   provider?:     'gemini'|'groq',
 *   model?:        string
 * }} payload
 */
export async function generateTestCases(payload) {
  const { data } = await api.post('/generate', payload)
  return data
}

/**
 * GET /api/generate/providers
 * Returns which AI providers are currently configured on the backend
 */
export async function getProviders() {
  const { data } = await api.get('/generate/providers')
  return data
}

/**
 * GET /api/health
 * Quick ping to check if the backend is running
 */
export async function checkHealth() {
  const { data } = await api.get('/health')
  return data
}

export default api
