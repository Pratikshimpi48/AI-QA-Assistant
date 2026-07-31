'use strict'

const env                = require('../config/env')
const JiraWatchlistModel = require('../models/JiraWatchlist')
const JiraConfigModel    = require('../models/JiraConfig')
const NotificationModel  = require('../models/Notification')
const { fetchJiraIssue, getIssueStatus, getIssueSummary, isReadyForQA, isReleasedStatus } = require('./jiraService')

let pollerInterval = null

/**
 * Poll a single watchlist item — fetch Jira status and create notification when status advances.
 * Ticket remains active in the Watchlist view until status reaches 'To Be Released' or 'Released'.
 */
async function pollWatchlistItem(item) {
  try {
    // Get the Jira config for this user
    const config = await JiraConfigModel.findByUserId(item.userId)
    if (!config || !config.jiraEmail || !config.jiraApiToken) {
      console.warn(`[JiraPoller] No Jira config for user ${item.userId}, skipping ${item.jiraTicketId}`)
      return
    }

    const issue   = await fetchJiraIssue(item.jiraBaseUrl || config.jiraBaseUrl, item.jiraTicketId, config.jiraEmail, config.jiraApiToken)
    const status  = getIssueStatus(issue)
    const summary = getIssueSummary(issue)
    const now     = new Date()

    console.log(`[JiraPoller] Ticket ${item.jiraTicketId} → status: "${status}"`)

    const prevStatus = item.lastNotifiedStatus || item.currentStatus || ''
    const statusChanged = prevStatus.length > 0 && prevStatus.toLowerCase() !== status.toLowerCase() && prevStatus !== 'Unknown'
    const isReleased = isReleasedStatus(status)
    const isQA       = isReadyForQA(status)

    // Notify user whenever ANY ticket status transition occurs
    if (statusChanged) {
      const notifType  = isReleased ? 'ticket-released' : (isQA ? 'mr-merged' : 'status-changed')
      const notifIcon  = isReleased ? '🚀' : (isQA ? '🧪' : '🔄')
      const notifTitle = `${notifIcon} ${item.jiraTicketId} status changed to "${status}"`
      const notifMsg   = `Ticket "${summary || item.jiraTicketId}" moved from status "${prevStatus}" to "${status}".`

      await NotificationModel.create({
        userId:       item.userId,
        type:         notifType,
        title:        notifTitle,
        message:      notifMsg,
        jiraTicketId: item.jiraTicketId,
        jiraBaseUrl:  item.jiraBaseUrl || config.jiraBaseUrl,
      })
      console.log(`[JiraPoller] 🔔 Notification created for ${item.jiraTicketId}: "${prevStatus}" → "${status}"`)
    }

    await JiraWatchlistModel.updateStatus(item._id || item.id, {
      summary,
      currentStatus:      status,
      lastNotifiedStatus: status,
      lastChecked:        now,
      notified:           isQA || isReleased,
      isReleased:         isReleased,
    })
  } catch (err) {
    console.warn(`[JiraPoller] Error polling ${item.jiraTicketId}: ${err.message}`)
  }
}

/**
 * Run one polling cycle across all active watchlist items.
 */
async function runPollCycle() {
  try {
    const activeItems = await JiraWatchlistModel.findAllActive()
    if (activeItems.length === 0) return

    console.log(`[JiraPoller] Running poll cycle — ${activeItems.length} active ticket(s)`)
    await Promise.allSettled(activeItems.map(item => pollWatchlistItem(item)))
  } catch (err) {
    console.warn('[JiraPoller] Cycle error:', err.message)
  }
}

/**
 * Start the background Jira polling interval.
 */
function startPolling() {
  if (pollerInterval) return  // already running

  const intervalMs = env.JIRA_POLL_INTERVAL_MS || 300_000  // default 5 min
  console.log(`🔄 Jira Poller started — polling every ${intervalMs / 1000}s`)

  // Initial poll after 10 seconds (let server fully boot first)
  setTimeout(runPollCycle, 10_000)

  pollerInterval = setInterval(runPollCycle, intervalMs)
}

/**
 * Stop the poller (useful for testing).
 */
function stopPolling() {
  if (pollerInterval) {
    clearInterval(pollerInterval)
    pollerInterval = null
    console.log('[JiraPoller] Stopped.')
  }
}

module.exports = { startPolling, stopPolling, runPollCycle }
