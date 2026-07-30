'use strict'

const { GoogleGenerativeAI } = require('@google/generative-ai')
const Groq = require('groq-sdk')

/**
 * Build a structured AI prompt to compare a new bug report against existing ones.
 * @param {Object} newBug  - { title, description, stepsToReproduce, expectedBehavior, actualBehavior }
 * @param {Array}  existing - array of history records with type === 'bug-report'
 * @returns {{ systemPrompt, userMessage }}
 */
function buildDuplicateCheckPrompt(newBug, existing) {
  const systemPrompt = `You are a QA expert specializing in defect management and duplicate bug detection.
Your task is to analyze a newly reported bug and compare it against a list of existing bug reports.
For each existing bug, calculate a similarity score (0-100) based on:
- Semantic similarity of title and description
- Overlap in steps to reproduce
- Same root cause or affected feature
- Same expected vs actual behavior pattern

Respond ONLY with a valid JSON array. Each element: { "id": "<id>", "similarity": <0-100>, "reason": "<brief reason>" }
Sort by similarity descending. Only include entries with similarity >= 30.
If no matches found, return an empty array [].`

  const existingSummary = existing
    .slice(0, 20) // limit to 20 most recent for performance
    .map((rec, i) => {
      const d = rec.data || {}
      return `[${i}] ID: ${rec._id || rec.id}
Title: ${d.title || rec.title || ''}
Summary: ${d.summary || ''}
Steps: ${Array.isArray(d.stepsToReproduce) ? d.stepsToReproduce.join(' | ') : (d.stepsToReproduce || '')}
Expected: ${d.expectedBehavior || ''}
Actual: ${d.actualBehavior || ''}`
    })
    .join('\n\n---\n\n')

  const userMessage = `NEW BUG TO CHECK:
Title: ${newBug.title || ''}
Description: ${newBug.description || ''}
Steps to Reproduce: ${newBug.stepsToReproduce || ''}
Expected Behavior: ${newBug.expectedBehavior || ''}
Actual Behavior: ${newBug.actualBehavior || ''}

EXISTING BUG REPORTS (${existing.length} total):
${existingSummary || 'No existing bug reports found.'}

Return JSON array of matches with similarity >= 30.`

  return { systemPrompt, userMessage }
}

/**
 * Parse the AI duplicate check response and enrich with existing bug metadata.
 */
function parseDuplicateCheckResponse(aiText, existingBugs) {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || aiText.match(/(\[[\s\S]*\])/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : aiText.trim()
    const parsed = JSON.parse(jsonStr)

    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(item => item && typeof item.similarity === 'number' && item.similarity >= 30)
      .map(item => {
        // Find the matching bug record for title/summary enrichment
        const matching = existingBugs.find(b => {
          const bid = String(b._id || b.id)
          return bid === String(item.id)
        })
        return {
          id:         item.id,
          similarity: Math.min(100, Math.max(0, Math.round(item.similarity))),
          reason:     item.reason || '',
          title:      matching?.data?.title || matching?.title || `Bug Report (${item.id})`,
          summary:    matching?.data?.summary || '',
          severity:   matching?.data?.severity || 'Unknown',
          createdAt:  matching?.createdAt || null,
        }
      })
      .sort((a, b) => b.similarity - a.similarity)
  } catch {
    return []
  }
}

/**
 * Run duplicate detection using Gemini → Groq fallback.
 */
async function detectDuplicates(newBug, existingBugs) {
  if (!existingBugs || existingBugs.length === 0) {
    return []
  }

  const { systemPrompt, userMessage } = buildDuplicateCheckPrompt(newBug, existingBugs)

  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai    = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: systemPrompt })
      const resp  = await model.generateContent(userMessage)
      const text  = resp.response.text()
      return parseDuplicateCheckResponse(text, existingBugs)
    } catch (geminiErr) {
      console.warn('[DuplicateDetection] Gemini failed, trying Groq:', geminiErr.message)
    }
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const chat = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
    })
    const text = chat.choices[0]?.message?.content || '[]'
    return parseDuplicateCheckResponse(text, existingBugs)
  }

  throw new Error('No AI provider configured for duplicate detection.')
}

module.exports = { detectDuplicates, buildDuplicateCheckPrompt, parseDuplicateCheckResponse }
