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

const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-2.0-flash',
]

/**
 * Generate test cases using Google Gemini API.
 *
 * @param {string} requirements
 * @param {string|null} fileName
 * @returns {Promise<{ testCases: Array, model: string, provider: string }>}
 */
async function generateWithGemini(requirements, fileName = null) {
  const genAI = getClient()
  const { systemPrompt, userMessage } = buildPrompt(requirements, fileName)

  let lastError = null

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature:     0.4,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
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
        model:    modelName,
        provider: 'Google Gemini',
      }
    } catch (err) {
      lastError = err
      const is429 = err.message?.includes('429') || err.message?.includes('Quota exceeded') || err.status === 429
      if (is429) {
        console.warn(`[Gemini] Model ${modelName} hit 429 quota limit. Retrying with fallback model...`)
        continue
      }
      if (err.message?.includes('API_KEY_SERVICE_BLOCKED')) {
        throw new Error(
          'Gemini API Service is blocked for this project. Enable "Generative Language API" in Google Cloud Console, or use the Groq provider.'
        )
      }
      throw err
    }
  }

  throw lastError || new Error('Gemini API call failed.')
}

module.exports = { generateWithGemini }
