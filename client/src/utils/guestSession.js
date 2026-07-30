const GUEST_SESSION_KEY = 'ai_qa_guest_session'

/**
 * Retrieve guest session history items from sessionStorage
 * @returns {Array}
 */
export function getGuestHistory() {
  try {
    const raw = sessionStorage.getItem(GUEST_SESSION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.warn('Failed to read guest sessionStorage:', err)
    return []
  }
}

/**
 * Save item into guest sessionStorage
 * @param {{ type: 'test-cases'|'bug-report', title: string, data: any, meta?: any }} item
 * @returns {Object}
 */
export function addGuestHistoryItem({ type, title, data, meta = {} }) {
  try {
    const current = getGuestHistory()
    const id = 'gst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const newItem = {
      id,
      _id: id,
      type,
      title,
      data,
      meta,
      createdAt: new Date().toISOString(),
      isGuest: true,
    }
    const updated = [newItem, ...current]
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updated))
    return newItem
  } catch (err) {
    console.warn('Failed to save to guest sessionStorage:', err)
    return null
  }
}

/**
 * Delete item from guest sessionStorage
 * @param {string} id
 * @returns {boolean}
 */
export function deleteGuestHistoryItem(id) {
  try {
    const current = getGuestHistory()
    const updated = current.filter((item) => item.id !== id && item._id !== id)
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updated))
    return true
  } catch (err) {
    console.warn('Failed to delete from guest sessionStorage:', err)
    return false
  }
}

/**
 * Calculate guest session statistics
 * @returns {{ totalTestRuns: number, totalTestCases: number, totalBugReports: number, hoursSaved: number, tokensUsed: number, recentActivity: Array }}
 */
export function getGuestStats() {
  const history = getGuestHistory()

  let totalTestRuns   = 0
  let totalTestCases  = 0
  let totalBugReports = 0
  let tokensUsed      = 0

  history.forEach((rec) => {
    if (rec.type === 'test-cases') {
      totalTestRuns += 1
      if (Array.isArray(rec.data)) {
        totalTestCases += rec.data.length
        tokensUsed += Math.max(420, rec.data.length * 130 + 280)
      }
    } else if (rec.type === 'bug-report') {
      totalBugReports += 1
      tokensUsed += 480
    }
  })

  const hoursSaved = Math.round((totalTestCases * 0.5 + totalBugReports * 0.75) * 10) / 10

  return {
    totalTestRuns,
    totalTestCases,
    totalBugReports,
    hoursSaved,
    tokensUsed,
    recentActivity: history.slice(0, 5),
  }
}

/**
 * Clear guest sessionStorage
 */
export function clearGuestSession() {
  try {
    sessionStorage.removeItem(GUEST_SESSION_KEY)
  } catch (_e) {
    // Ignore error
  }
}
