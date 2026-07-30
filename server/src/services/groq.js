'use strict'

const Groq = require('groq-sdk')
const { buildPrompt, parseResponse } = require('./promptBuilder')

let _client = null

function getClient() {
  if (!_client) {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY is not set in .env')
    _client = new Groq({ apiKey: key })
  }
  return _client
}

/**
 * Available free-tier Groq models — ordered by quality descending.
 * Updated to current live models (July 2026).
 * Full list: https://console.groq.com/docs/models
 */
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',   // Llama 3.3 70B  — best quality on free tier
  'llama-3.1-8b-instant',      // Llama 3.1  8B  — fastest fallback
]

/**
 * Generate test cases using Groq (Llama models — free tier, no credit card).
 *
 * Free tier limits (Groq):
 *   - 30 RPM
 *   - 1,000 RPD
 *   - 30,000 TPM  (Llama 4 Scout)
 *   - 500,000 TPD
 *
 * @param {string} requirements
 * @param {string|null} fileName
 * @param {string|null} preferredModel  - Override the default model
 * @returns {Promise<{ testCases: Array, model: string, provider: string }>}
 */
async function generateWithGroq(requirements, fileName = null, preferredModel = null, template = null) {
  const client = getClient()
  const { systemPrompt, userMessage } = buildPrompt(requirements, fileName, template)

  const models = preferredModel
    ? [preferredModel, ...GROQ_MODELS.filter(m => m !== preferredModel)]
    : GROQ_MODELS

  let lastError = null

  for (const modelId of models) {
    try {
      const completion = await client.chat.completions.create({
        model:       modelId,
        temperature: 0.4,
        max_tokens:  4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage  },
        ],
      })

      const text = completion.choices?.[0]?.message?.content ?? ''
      const testCases = parseResponse(text)

      if (testCases.length === 0) {
        lastError = new Error(`${modelId} returned unparseable JSON. Trying next model…`)
        continue
      }

      return {
        testCases,
        model:    modelId,
        provider: 'Groq (Llama)',
      }
    } catch (err) {
      // 429 = rate limit → try next model
      if (err.status === 429) {
        lastError = new Error(`${modelId} rate limited. Trying next model…`)
        continue
      }
      throw err  // propagate unexpected errors immediately
    }
  }

  throw lastError ?? new Error('All Groq models failed or returned empty responses.')
}

module.exports = { generateWithGroq, GROQ_MODELS }
