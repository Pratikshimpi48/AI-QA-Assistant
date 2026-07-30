'use strict'

const express            = require('express')
const router             = express.Router()
const { authenticateToken } = require('../middleware/auth')
const JiraConfigModel    = require('../models/JiraConfig')
const JiraWatchlistModel = require('../models/JiraWatchlist')
const { fetchJiraIssue, getIssueStatus, getIssueSummary } = require('../services/jiraService')

/* ──────────────────────────────────────────────────
   Jira Config (per-user credentials from Settings)
──────────────────────────────────────────────────── */

/**
 * GET /api/jira/config — get user's Jira connection (token masked)
 */
router.get('/config', authenticateToken, async (req, res, next) => {
  try {
    const config = await JiraConfigModel.findByUserId(req.user.id)
    return res.json({ status: 'ok', config: JiraConfigModel.sanitize(config) })
  } catch (err) { next(err) }
})

/**
 * POST /api/jira/config — save or update user's Jira credentials
 */
router.post('/config', authenticateToken, async (req, res, next) => {
  try {
    const { jiraBaseUrl, jiraEmail, jiraApiToken } = req.body
    if (!jiraBaseUrl || !jiraEmail || !jiraApiToken) {
      return res.status(400).json({ status: 'error', message: 'jiraBaseUrl, jiraEmail, and jiraApiToken are required.' })
    }

    // Validate credentials by fetching the Jira myself endpoint
    try {
      const base64Auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')
      const axios = require('axios')
      await axios.get(`${jiraBaseUrl.replace(/\/$/, '')}/rest/api/3/myself`, {
        headers: { Authorization: `Basic ${base64Auth}`, Accept: 'application/json' },
        timeout: 8000,
      })
    } catch (validationErr) {
      return res.status(400).json({
        status:  'error',
        message: `Jira connection failed: ${validationErr.response?.data?.errorMessages?.[0] || validationErr.message}. Please check your credentials.`,
      })
    }

    const config = await JiraConfigModel.upsert(req.user.id, { jiraBaseUrl, jiraEmail, jiraApiToken })
    return res.json({ status: 'ok', config: JiraConfigModel.sanitize(config), message: 'Jira connected successfully.' })
  } catch (err) { next(err) }
})

/**
 * DELETE /api/jira/config — disconnect Jira for this user
 */
router.delete('/config', authenticateToken, async (req, res, next) => {
  try {
    await JiraConfigModel.deleteByUserId(req.user.id)
    return res.json({ status: 'ok', message: 'Jira disconnected.' })
  } catch (err) { next(err) }
})

/* ──────────────────────────────────────────────────
   Jira Watchlist
──────────────────────────────────────────────────── */

/**
 * GET /api/jira/watchlist — get user's watchlist
 */
router.get('/watchlist', authenticateToken, async (req, res, next) => {
  try {
    const items = await JiraWatchlistModel.findByUserId(req.user.id)
    return res.json({ status: 'ok', watchlist: items })
  } catch (err) { next(err) }
})

/**
 * POST /api/jira/watchlist — add Jira ticket to watchlist
 */
router.post('/watchlist', authenticateToken, async (req, res, next) => {
  try {
    const { jiraTicketId } = req.body
    const ticketId = (jiraTicketId || '').trim().toUpperCase()

    if (!ticketId) {
      return res.status(400).json({ status: 'error', message: 'Jira ticket ID is required (e.g. QA-145).' })
    }

    // Basic format check — must be letters-digits (e.g. QA-145, PROJ-1000)
    if (!/^[A-Z][A-Z0-9]+-\d+$/.test(ticketId)) {
      return res.status(400).json({
        status:  'error',
        message: `"${ticketId}" is not a valid Jira ticket ID format. Expected format: PROJECT-123 (e.g. QA-145, BUG-32).`,
      })
    }

    // Get user's Jira config
    const config = await JiraConfigModel.findByUserId(req.user.id)
    if (!config) {
      return res.status(503).json({ status: 'error', message: 'Jira is not configured. Please connect Jira in Settings first.' })
    }

    // Check if ticket already in watchlist
    const existingWatchlist = await JiraWatchlistModel.findByUserId(req.user.id)
    const alreadyWatching   = existingWatchlist.find(w => w.jiraTicketId === ticketId && !w.notified)
    if (alreadyWatching) {
      return res.status(409).json({
        status:  'error',
        message: `Ticket ${ticketId} is already in your watchlist.`,
      })
    }

    // Validate ticket exists in Jira — clear errors for each failure mode
    let summary = ''
    let currentStatus = 'Unknown'
    try {
      const issue   = await fetchJiraIssue(config.jiraBaseUrl, ticketId, config.jiraEmail, config.jiraApiToken)
      currentStatus = getIssueStatus(issue)
      summary       = getIssueSummary(issue)
    } catch (jiraErr) {
      const httpStatus = jiraErr.response?.status

      if (httpStatus === 404) {
        return res.status(404).json({
          status:  'error',
          message: `Ticket "${ticketId}" was not found in your Jira board. Please check the ticket ID and try again.`,
        })
      }
      if (httpStatus === 401 || httpStatus === 403) {
        return res.status(400).json({
          status:  'error',
          message: `Access denied to Jira ticket "${ticketId}". Your Jira credentials may be incorrect or you may not have permission to view this ticket.`,
        })
      }
      if (jiraErr.code === 'ECONNREFUSED' || jiraErr.code === 'ENOTFOUND') {
        return res.status(400).json({
          status:  'error',
          message: `Cannot reach your Jira server at "${config.jiraBaseUrl}". Please check your Jira URL in Settings.`,
        })
      }
      // Generic fallback
      return res.status(400).json({
        status:  'error',
        message: `Could not verify ticket "${ticketId}" in Jira: ${jiraErr.response?.data?.errorMessages?.[0] || jiraErr.message}`,
      })
    }

    const item = await JiraWatchlistModel.create({
      userId:       req.user.id,
      jiraTicketId: ticketId,
      jiraBaseUrl:  config.jiraBaseUrl,
      summary,
      currentStatus,
    })
    return res.status(201).json({
      status:  'ok',
      item,
      message: `${ticketId} added to watchlist.`,
    })
  } catch (err) { next(err) }
})


/**
 * DELETE /api/jira/watchlist/:id — remove from watchlist
 */
router.delete('/watchlist/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await JiraWatchlistModel.deleteByIdAndUserId(req.params.id, req.user.id)
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Watchlist item not found.' })
    return res.json({ status: 'ok', message: 'Removed from watchlist.' })
  } catch (err) { next(err) }
})

module.exports = router
