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

  // gemini-flash-latest is the active free-tier endpoint model
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.4,   // lower = more structured, consistent output
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',  // tells Gemini to output raw JSON
    },
  })

  try {
    const result = await model.generateContent(userMessage)
    let text = ''
    try {
      text = result.response.text()
    } catch {
      // Fallback: extract text directly from candidates parts if response.text() fails
      const candidate = result.response?.candidates?.[0]
      const part = candidate?.content?.parts?.find(p => p.text)
      text = part?.text || ''
    }

    const testCases = parseResponse(text)

    if (testCases.length === 0) {
      console.warn('[Gemini] Response could not be parsed into test cases. Raw preview:', text ? text.slice(0, 300) : '(empty)')
      throw new Error('Gemini returned an empty or unparseable response. Please try again.')
    }

    return {
      testCases,
      model: 'gemini-flash-latest',
      provider: 'Google Gemini',
    }
  } catch (err) {
    if (err.message?.includes('API_KEY_SERVICE_BLOCKED')) {
      throw new Error(
        'Gemini API Service is blocked for this project. Enable "Generative Language API" in Google Cloud Console, or use the Groq provider.'
      )
    }
    throw err
  }
}

module.exports = { generateWithGemini }
