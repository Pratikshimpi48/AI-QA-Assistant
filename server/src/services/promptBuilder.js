'use strict'

/**
 * Shared QA test-case prompt builder.
 * Returns a rich system prompt + user message pair for any AI provider.
 *
 * @param {string} requirements  - Raw requirement text or file content
 * @param {string|null} fileName - Optional source filename
 * @returns {{ systemPrompt: string, userMessage: string }}
 */
function buildPrompt(requirements, fileName = null, template = null) {
  const source = fileName ? `document "${fileName}"` : 'the requirements below'

  let fieldsInstruction = `Each test case object MUST have these exact fields:
{
  "id":       "TC-001",
  "title":    "...",
  "type":     "Positive|Negative|Edge Case|Security",
  "priority": "High|Medium|Low",
  "steps":    ["step 1", "step 2", "..."],
  "expected": "...",
  "tags":     ["feature", "auth"]
}`

  if (template && template.structure && Array.isArray(template.structure.fields) && template.structure.fields.length > 0) {
    const fields = template.structure.fields

    const sampleObj = {}
    fields.forEach(f => {
      if (f === 'testCaseId') sampleObj[f] = 'TC_BAP_001'
      else if (f === 'id') sampleObj[f] = 'TC-001'
      else if (f === 'scenario' || f === 'title' || f === 'scenarioTitle') sampleObj[f] = 'Verify the user is able to perform action'
      else if (f === 'stepDescription' || f === 'steps' || f === 'executionSteps' || f === 'stepsToTrigger') sampleObj[f] = '1. Click button\n2. Enter valid details'
      else if (f === 'expectedResult' || f === 'expected' || f === 'expectedOutputs') sampleObj[f] = 'User should see success message and be redirected.'
      else if (f === 'actualResult') sampleObj[f] = 'User is able to see success message and redirected.'
      else if (f === 'testData' || f === 'inputData') sampleObj[f] = 'Email: test.user@example.com, Password: TestPassword123'
      else if (f === 'status') sampleObj[f] = 'Passed'
      else if (f === 'bugId') sampleObj[f] = ''
      else if (f === 'qaComments') sampleObj[f] = 'Verified on staging environment.'
      else sampleObj[f] = '...'
    })

    fieldsInstruction = `ORGANIZATIONAL TEMPLATE MANDATE ("${template.name}"):
Each test case object MUST be populated using the EXACT schema structure fields displayed to the user in the template preview.
Each test case object MUST contain these exact JSON keys:
${JSON.stringify(sampleObj, null, 2)}`
  }

  const systemPrompt = `You are an expert Principal QA Engineer with 15+ years of experience writing exhaustive, enterprise-grade software test cases. Your goal is to achieve 100% test coverage.

Analyse the provided requirements thoroughly and generate AS MANY comprehensive, detailed, non-redundant test cases as necessary to thoroughly test every aspect of the feature.

Cover:
1. Positive test cases (happy path, valid inputs, default workflows, success criteria)
2. Negative test cases (invalid inputs, missing/null fields, incorrect formats, unauthorized access)
3. Edge cases & boundary values (max/min lengths, extreme values, special characters, zero values)
4. Security, state transitions & error handling scenarios

DO NOT arbitrarily limit or cap the number of test cases. Generate as many relevant test cases as the requirements warrant to ensure complete test coverage.

OUTPUT FORMAT — respond with a valid JSON array and NOTHING ELSE.
No markdown, no code fences, no explanation text. Only the raw JSON array.

${fieldsInstruction}`

  const userMessage = `Analyse ${source} thoroughly and generate all necessary test cases for 100% coverage:\n\n${requirements.slice(0, 15_000)}`

  return { systemPrompt, userMessage }
}

/**
 * Parse the AI text response into a structured array of test cases.
 * Handles: raw JSON, markdown code blocks, partial/truncated JSON.
 *
 * @param {string} text
 * @returns {Array}
 */
function parseResponse(text) {
  if (!text || typeof text !== 'string') return []

  // 1. Strip reasoning/thought blocks if present
  let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim()

  // 2. Extract content inside ```json ... ``` or ``` ... ``` if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim()
  }

  // 3. Try straight parse
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.testCases)) return parsed.testCases
  } catch { /* continue */ }

  // 4. Try to extract outer [...] array block
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/)
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Try fixing trailing commas in JSON array
      try {
        const sanitized = arrayMatch[0].replace(/,\s*([\]\}])/g, '$1')
        const parsed = JSON.parse(sanitized)
        if (Array.isArray(parsed)) return parsed
      } catch { /* continue */ }
    }
  }

  // 5. Truncated JSON Repair: if response was cut off mid-stream, salvage completed objects
  const startIdx = cleaned.indexOf('[')
  if (startIdx !== -1) {
    let jsonStr = cleaned.slice(startIdx).trim()
    const lastObjectIdx = jsonStr.lastIndexOf('}')
    if (lastObjectIdx !== -1) {
      const truncatedArray = jsonStr.slice(0, lastObjectIdx + 1) + ']'
      try {
        const parsed = JSON.parse(truncatedArray)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {
        try {
          const sanitized = truncatedArray.replace(/,\s*([\]\}])/g, '$1')
          const parsed = JSON.parse(sanitized)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch { /* continue */ }
      }
    }
  }

  return []
}

function buildBugReportPrompt(issueDescription, template = null) {
  const templateNotice = template ? `\n\nORGANIZATIONAL REPORT TEMPLATE ("${template.name}"): Populate the bug report using the required structure fields: ${JSON.stringify(template.structure?.fields || [])}` : ''

  const systemPrompt = `You are an expert QA Engineer. Your job is to transform raw issue descriptions, user reports, or log snippets into a professional, structured bug report suitable for Jira or GitHub Issues.${templateNotice}

OUTPUT FORMAT — respond with a valid JSON object and NOTHING ELSE.
No markdown code fences, no extra text. Only the raw JSON object.

The JSON object MUST have these exact fields:
{
  "title": "Concise, descriptive bug title",
  "severity": "Critical|High|Medium|Low",
  "type": "Bug",
  "environment": "Production / Staging / Chrome 124 / macOS",
  "summary": "Clear summary of the bug and impact",
  "stepsToReproduce": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ],
  "expectedBehavior": "What should have happened",
  "actualBehavior": "What actually happened",
  "workaround": "Potential workaround if any, or 'None'",
  "tags": ["frontend", "api", "auth"]
}`

  const userMessage = `Transform the following issue description into a structured bug report:\n\n${issueDescription.slice(0, 10_000)}`

  return { systemPrompt, userMessage }
}

function parseBugReportResponse(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
  } catch { /* continue */ }

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch { /* continue */ }
  }

  return {
    title: 'Bug Report',
    severity: 'Medium',
    summary: text.slice(0, 200),
    stepsToReproduce: ['1. Open application', '2. Perform action described in report'],
    expectedBehavior: 'Feature works without errors',
    actualBehavior: text,
    workaround: 'None',
    tags: ['bug'],
  }
}

function buildWorklogPrompt(jiraTicketData, userNotes = '', timeSpent = '', worklogDate = '') {
  const safeTicketId = jiraTicketData.ticketId || 'JIRA-123'
  const safeSummary  = (jiraTicketData.summary || '').replace(/"/g, "'")
  const safeStatus   = jiraTicketData.status || 'In Progress'

  const systemPrompt = `You are a Principal Software Engineer & QA Leader. Your task is to generate a concise, professional Work Description summary BASED PRIMARILY AND EXCLUSIVELY ON THE COMMENTS POSTED ON THE JIRA TICKET.

CRITICAL MANDATE:
1. Analyze all user comments posted on the Jira ticket (development updates, code review notes, testing observations, bug reports, deployment updates, user notes).
2. Synthesize these comments into a clear, structured "Work Description" that summarizes the progression of work and exact updates recorded in the ticket comments.
3. The work description is NOT limited to testing — it reflects whatever work updates were discussed and logged in the ticket comments by Jira users.

OUTPUT FORMAT — respond with a valid JSON object and NOTHING ELSE.
No markdown code fences, no extra text. Only the raw JSON object.

The JSON object MUST have these exact fields:
{
  "ticketId": "${safeTicketId}",
  "summary": "${safeSummary}",
  "status": "${safeStatus}",
  "timeSpent": "${timeSpent || '1h 30m'}",
  "worklogDate": "${worklogDate || new Date().toISOString().split('T')[0]}",
  "worklogSummary": "Rich Markdown Work Description synthesizing the work updates and details from ticket comments...",
  "bulletPoints": [
    "Key work update extracted from ticket comments",
    "Verification or implementation detail noted in discussion"
  ],
  "formattedJiraWorklog": "*Work Log — [${safeTicketId}] (${worklogDate || 'Today'})*\\n• Synthesized update based on ticket comments\\n• Current Status: ${safeStatus}"
}`

  const userMessage = `Synthesize a professional Work Description for this Jira Ticket based on all comments and updates posted by Jira users:

Ticket ID: ${safeTicketId}
Summary: ${safeSummary}
Status: ${safeStatus}
Issue Type: ${jiraTicketData.issueType || 'Task'}

*** COMMENTS POSTED ON JIRA TICKET (PRIMARY SOURCE) ***:
${jiraTicketData.commentsText || 'No comments posted yet on this ticket. (Use ticket description & user notes below)'}

Ticket Description Context:
${(jiraTicketData.descriptionText || 'No description provided.').slice(0, 2000)}

Work Log Date: ${worklogDate || 'Today'}
Time Spent: ${timeSpent || 'Not specified'}
Additional User Work Notes: ${userNotes || 'None'}`

  return { systemPrompt, userMessage }
}

function parseWorklogResponse(text, ticketData = {}, timeSpent = '') {
  if (!text || typeof text !== 'string') {
    return {
      ticketId: ticketData.ticketId || 'JIRA-TICKET',
      summary: ticketData.summary || 'Work Log',
      status: ticketData.status || 'In Progress',
      timeSpent: timeSpent || '1h 30m',
      worklogSummary: 'Performed QA testing and verification on feature.',
      bulletPoints: ['Executed QA verification test suite', 'Confirmed functionality on environment'],
      formattedJiraWorklog: `*QA Work Log — [${ticketData.ticketId || 'JIRA'}]*\n• Executed QA verification test suite\n• Confirmed functionality`,
    }
  }

  const cleaned = text
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        ticketId:             parsed.ticketId || ticketData.ticketId || 'JIRA-TICKET',
        summary:              parsed.summary || ticketData.summary || '',
        status:               parsed.status || ticketData.status || 'In Progress',
        timeSpent:            parsed.timeSpent || timeSpent || '1h 30m',
        worklogSummary:       parsed.worklogSummary || 'Performed QA testing and verification.',
        bulletPoints:         Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
        formattedJiraWorklog: parsed.formattedJiraWorklog || '',
      }
    }
  } catch { /* continue */ }

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      return {
        ticketId:             parsed.ticketId || ticketData.ticketId || 'JIRA-TICKET',
        summary:              parsed.summary || ticketData.summary || '',
        status:               parsed.status || ticketData.status || 'In Progress',
        timeSpent:            parsed.timeSpent || timeSpent || '1h 30m',
        worklogSummary:       parsed.worklogSummary || 'Performed QA testing and verification.',
        bulletPoints:         Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
        formattedJiraWorklog: parsed.formattedJiraWorklog || '',
      }
    } catch { /* continue */ }
  }

  return {
    ticketId: ticketData.ticketId || 'JIRA-TICKET',
    summary: ticketData.summary || 'QA Work Log',
    status: ticketData.status || 'In Progress',
    timeSpent: timeSpent || '1h 30m',
    worklogSummary: cleaned.slice(0, 500),
    bulletPoints: ['Executed QA testing on feature', 'Verified acceptance criteria'],
    formattedJiraWorklog: `*QA Work Log — [${ticketData.ticketId || 'JIRA'}]*\n• Executed QA testing on feature\n• Verified acceptance criteria`,
  }
}

module.exports = {
  buildPrompt,
  parseResponse,
  buildBugReportPrompt,
  parseBugReportResponse,
  buildWorklogPrompt,
  parseWorklogResponse,
}
