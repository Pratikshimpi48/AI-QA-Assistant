'use strict'

const { GoogleGenerativeAI } = require('@google/generative-ai')
const { buildPrompt, parseResponse } = require('./promptBuilder')

let _client = null

function getClient() {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY is not set in .env')
    _client = new GoogleGenerativeAI(key)
  }
  return _client
}

/**
 * Generate test cases using Google Gemini 2.0 Flash (free tier).
 *
 * Free tier limits (Google AI Studio):
 *   - 15 RPM  (requests per minute)
 *   - 1M TPM  (tokens per minute)
 *   - 1500 RPD (requests per day)
 *
 * @param {string} requirements
 * @param {string|null} fileName
 * @returns {Promise<{ testCases: Array, model: string, provider: string }>}
 */
async function generateWithGemini(requirements, fileName = null) {
  const genAI = getClient()
  const { systemPrompt, userMessage } = buildPrompt(requirements, fileName)

  // gemini-2.0-flash is the recommended free-tier model (fast + capable)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature:     0.4,   // lower = more structured, consistent output
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',  // tells Gemini to output raw JSON
    },
  })

  const result = await model.generateContent(userMessage)
  const text   = result.response.text()
  const testCases = parseResponse(text)

  if (testCases.length === 0) {
    throw new Error('Gemini returned an empty or unparseable response. Please try again.')
  }

  return {
    testCases,
    model:    'gemini-2.0-flash',
    provider: 'Google Gemini',
  }
}

module.exports = { generateWithGemini }
