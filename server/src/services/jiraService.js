'use strict'

const axios = require('axios')
const env   = require('../config/env')

/**
 * Clean a Jira Base URL to extract just the origin domain.
 * e.g. "https://hotwaxsystems.atlassian.net/jira/software/c/projects/ASB/boards/3"
 *   -> "https://hotwaxsystems.atlassian.net"
 */
function cleanJiraBaseUrl(rawUrl) {
  if (!rawUrl) return ''
  try {
    const parsed = new URL(rawUrl.trim())
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return rawUrl.trim().replace(/\/$/, '')
  }
}

/**
 * Fetch a Jira issue via REST API v3.
 * @param {string} jiraBaseUrl - e.g. https://yourcompany.atlassian.net
 * @param {string} ticketId    - e.g. QA-145
 * @param {string} email       - Jira account email
 * @param {string} apiToken    - Jira API token
 */
async function fetchJiraIssue(jiraBaseUrl, ticketId, email, apiToken) {
  const baseUrl   = cleanJiraBaseUrl(jiraBaseUrl)
  const base64Auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
  const url        = `${baseUrl}/rest/api/3/issue/${ticketId}`

  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${base64Auth}`,
      Accept:        'application/json',
    },
    timeout: 10_000,
  })

  return response.data
}

/**
 * Extract the issue status name from a Jira REST API v3 issue object.
 */
function getIssueStatus(issue) {
  return issue?.fields?.status?.name || 'Unknown'
}

/**
 * Extract the issue summary from a Jira issue object.
 */
function getIssueSummary(issue) {
  return issue?.fields?.summary || ''
}

/**
 * Check if a Jira status means the MR has been merged / feature is ready for QA.
 */
function isReadyForQA(status) {
  const readyStatuses = env.JIRA_READY_STATUSES || ['Ready for QA', 'In QA', 'Done', 'Resolved', 'Merged', 'To Be Released', 'Released']
  return readyStatuses.some(s => s.toLowerCase() === (status || '').toLowerCase())
}

/**
 * Check if a Jira status means the ticket has reached final release stage ("To Be Released" or "Released").
 * Intermediate statuses like "Done", "Resolved", or "Closed" in sprint do NOT trigger auto-release.
 */
function isReleasedStatus(status) {
  const s = (status || '').toLowerCase().trim()
  const releaseKeywords = [
    'to be released',
    'released',
    'released to production',
    'released to prod',
  ]
  return releaseKeywords.some(rel => s === rel || s.includes('to be released') || s === 'released')
}

/**
 * Recursively extract plain text from Atlassian Document Format (ADF) nodes.
 */
function extractADFText(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.type === 'text' && node.text) return node.text
  if (Array.isArray(node.content)) {
    return node.content.map(extractADFText).join(' ')
  }
  return ''
}

/**
 * Extract structured ticket details for AI Work Log generation.
 */
function extractJiraTicketDetails(issue) {
  if (!issue || !issue.fields) return null

  const ticketId  = issue.key || ''
  const summary   = issue.fields.summary || ''
  const status    = issue.fields.status?.name || 'Unknown'
  const issueType = issue.fields.issuetype?.name || 'Task'
  const priority  = issue.fields.priority?.name || 'Medium'

  let descriptionText = ''
  if (typeof issue.fields.description === 'string') {
    descriptionText = issue.fields.description
  } else if (issue.fields.description && typeof issue.fields.description === 'object') {
    descriptionText = extractADFText(issue.fields.description)
  }

  let commentsText = ''
  let commentsList = []
  const comments = issue.fields.comment?.comments
  if (Array.isArray(comments) && comments.length > 0) {
    commentsList = comments
      .slice(-15)
      .map(c => {
        const author  = c.author?.displayName || c.author?.emailAddress || 'Jira User'
        const dateStr = c.created ? new Date(c.created).toLocaleString() : ''
        const body    = typeof c.body === 'string' ? c.body : extractADFText(c.body)
        return {
          author,
          created: c.created || '',
          dateStr,
          body: (body || '').trim(),
        }
      })
      .filter(c => c.body.length > 0)

    commentsText = commentsList
      .map(c => `[Comment by ${c.author}${c.dateStr ? ' on ' + c.dateStr : ''}]:\n${c.body}`)
      .join('\n\n---\n\n')
  }

  return {
    ticketId,
    summary,
    status,
    issueType,
    priority,
    descriptionText: descriptionText.trim(),
    commentsText: commentsText.trim(),
    commentsList,
  }
}

module.exports = {
  cleanJiraBaseUrl,
  fetchJiraIssue,
  getIssueStatus,
  getIssueSummary,
  isReadyForQA,
  isReleasedStatus,
  extractADFText,
  extractJiraTicketDetails,
}
