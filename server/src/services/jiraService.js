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
  const readyStatuses = env.JIRA_READY_STATUSES || ['Ready for QA', 'In QA', 'Done', 'Resolved', 'Merged']
  return readyStatuses.some(s => s.toLowerCase() === (status || '').toLowerCase())
}

module.exports = { cleanJiraBaseUrl, fetchJiraIssue, getIssueStatus, getIssueSummary, isReadyForQA }
