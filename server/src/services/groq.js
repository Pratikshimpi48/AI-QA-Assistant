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
 * The selector tries them in order and falls back on rate-limit errors.
 */
const GROQ_MODELS = [
  'llama-4-scout-17b-16e-instruct',   // Llama 4 Scout  — fast, free, good quality
  'llama3-70b-8192',                   // Llama 3 70B    — strong reasoning
  'llama3-8b-8192',                    // Llama 3 8B     — fastest fallback
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
async function generateWithGroq(requirements, fileName = null, preferredModel = null) {
  const client = getClient()
  const { systemPrompt, userMessage } = buildPrompt(requirements, fileName)

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
