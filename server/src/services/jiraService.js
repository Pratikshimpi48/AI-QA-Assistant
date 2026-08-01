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
 * Helper to check if a comment's author matches the user's Jira account (email or display name).
 */
function isUserAuthor(authorObj, filterEmail) {
  if (!filterEmail) return true
  if (!authorObj) return false

  const fEmail = (filterEmail || '').toLowerCase().trim()
  if (!fEmail) return true

  const email = (authorObj.emailAddress || '').toLowerCase().trim()
  const name  = (authorObj.displayName || '').toLowerCase().trim()

  if (email && (email === fEmail || email.includes(fEmail) || fEmail.includes(email))) {
    return true
  }

  const username = fEmail.split('@')[0].replace(/[^a-z0-9]/g, '')
  const nameClean = name.replace(/[^a-z0-9]/g, '')

  if (username && nameClean && (nameClean.includes(username) || username.includes(nameClean))) {
    return true
  }

  const emailParts = fEmail.split('@')[0].split(/[^a-z0-9]+/i).filter(p => p.length >= 3)
  for (const part of emailParts) {
    if (nameClean.includes(part)) return true
  }

  return false
}

/**
 * Extract structured ticket details for AI Work Log generation.
 * Filters comments so that ONLY comments authored by the user (filterEmail) are extracted.
 */
function extractJiraTicketDetails(issue, filterEmail = null) {
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
  let totalCommentsCount = 0
  let userCommentsCount  = 0

  const allComments = issue.fields.comment?.comments
  if (Array.isArray(allComments) && allComments.length > 0) {
    totalCommentsCount = allComments.length

    // Filter comments authored ONLY by the logged-in user
    const userComments = filterEmail
      ? allComments.filter(c => isUserAuthor(c.author, filterEmail))
      : allComments

    userCommentsCount = userComments.length

    commentsList = userComments
      .map(c => {
        const author  = c.author?.displayName || c.author?.emailAddress || 'Jira User'
        const dateStr = c.created ? new Date(c.created).toLocaleString() : ''
        const body    = typeof c.body === 'string' ? c.body : extractADFText(c.body)
        return {
          id: c.id || '',
          commentId: c.id || '',
          author,
          created: c.created || '',
          dateStr,
          body: (body || '').trim(),
          isUserComment: true,
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
    totalCommentsCount,
    userCommentsCount,
    filterEmail: filterEmail || null,
  }
}

/**
 * Delete a specific comment from a Jira issue.
 * Strictly limited to user-initiated actions via frontend UI.
 */
async function deleteJiraComment(jiraBaseUrl, ticketId, commentId, email, apiToken) {
  if (!jiraBaseUrl || !ticketId || !commentId || !email || !apiToken) {
    throw new Error('Missing Jira credentials, ticket ID, or comment ID.')
  }
  const cleanUrl = cleanJiraBaseUrl(jiraBaseUrl)
  const authHeader = 'Basic ' + Buffer.from(`${email.trim()}:${apiToken.trim()}`).toString('base64')

  const response = await axios.delete(
    `${cleanUrl}/rest/api/3/issue/${ticketId}/comment/${commentId}`,
    {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    }
  )
  return response.data
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
  deleteJiraComment,
}
