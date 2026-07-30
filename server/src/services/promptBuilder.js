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
  const templateNotice = template ? `\n\nORGANIZATIONAL REPORT TEMPLATE ("${template.name}"): Populate each test case using the required structure fields: ${JSON.stringify(template.structure?.fields || [])}` : ''

  const systemPrompt = `You are an expert Principal QA Engineer with 15+ years of experience writing exhaustive, enterprise-grade software test cases. Your goal is to achieve 100% test coverage.${templateNotice}

Analyse the provided requirements thoroughly and generate AS MANY comprehensive, detailed, non-redundant test cases as necessary to thoroughly test every aspect of the feature.

Cover:
1. Positive test cases (happy path, valid inputs, default workflows, success criteria)
2. Negative test cases (invalid inputs, missing/null fields, incorrect formats, unauthorized access)
3. Edge cases & boundary values (max/min lengths, extreme values, special characters, zero values)
4. Security, state transitions & error handling scenarios

DO NOT arbitrarily limit or cap the number of test cases. Generate as many relevant test cases as the requirements warrant to ensure complete test coverage.

OUTPUT FORMAT — respond with a valid JSON array and NOTHING ELSE.
No markdown, no code fences, no explanation text. Only the raw JSON array.

Each test case object MUST have these exact fields:
{
  "id":       "TC-001",           // sequential zero-padded ID (TC-001, TC-002, ...)
  "title":    "...",              // concise, descriptive action-based title
  "type":     "Positive|Negative|Edge Case|Security",
  "priority": "High|Medium|Low",
  "steps":    ["step 1", "step 2", "..."],  // array of clear, step-by-step actions
  "expected": "...",              // exact expected result
  "tags":     ["feature", "auth"]   // 1-3 relevant feature tags
}`

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

module.exports = { buildPrompt, parseResponse, buildBugReportPrompt, parseBugReportResponse }
