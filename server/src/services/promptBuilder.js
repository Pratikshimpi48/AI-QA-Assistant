'use strict'

/**
 * Shared QA test-case prompt builder.
 * Returns a rich system prompt + user message pair for any AI provider.
 *
 * @param {string} requirements  - Raw requirement text or file content
 * @param {string|null} fileName - Optional source filename
 * @returns {{ systemPrompt: string, userMessage: string }}
 */
function buildPrompt(requirements, fileName = null) {
  const source = fileName ? `document "${fileName}"` : 'the requirements below'

  const systemPrompt = `You are an expert QA Engineer with 10+ years of experience writing
comprehensive software test cases. Your job is to analyse requirements and produce
structured, professional test cases covering:

1. Positive test cases (happy path — valid inputs, expected workflows)
2. Negative test cases (invalid inputs, missing data, wrong types)
3. Edge cases (boundary values, extreme inputs, concurrent actions)
4. Security / access-control cases where relevant

OUTPUT FORMAT — respond with a valid JSON array and NOTHING ELSE.
No markdown, no code fences, no explanation text. Only the raw JSON array.

Each test case object MUST have these exact fields:
{
  "id":       "TC-001",           // sequential, zero-padded
  "title":    "...",              // concise action-based title
  "type":     "Positive|Negative|Edge Case|Security",
  "priority": "High|Medium|Low",
  "steps":    ["step 1", "step 2", "..."],  // array of clear action steps
  "expected": "...",              // single-sentence expected result
  "tags":     ["login", "auth"]   // 1-3 relevant feature tags
}

Generate between 8 and 15 test cases. Cover all acceptance criteria explicitly.`

  const userMessage = `Analyse ${source} and generate test cases:\n\n${requirements.slice(0, 12_000)}`
  // Slice to 12K chars to stay within free-tier token budgets

  return { systemPrompt, userMessage }
}

/**
 * Parse the AI text response into a structured array of test cases.
 * Handles: raw JSON, JSON inside a markdown code block, partial JSON.
 *
 * @param {string} text
 * @returns {Array}
 */
function parseResponse(text) {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  // Try straight parse
  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch { /* continue */ }

  // Try to extract the first [...] block
  const match = cleaned.match(/\[[\s\S]*\]/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* continue */ }
  }

  return []
}

function buildBugReportPrompt(issueDescription) {
  const systemPrompt = `You are an expert QA Engineer. Your job is to transform raw issue descriptions, user reports, or log snippets into a professional, structured bug report suitable for Jira or GitHub Issues.

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

module.exports = { buildPrompt, parseResponse, buildBugReportPrompt, parseBugReportResponse }

