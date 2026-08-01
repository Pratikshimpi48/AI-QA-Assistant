'use strict'

const { generateWithGemini } = require('./gemini')
const { generateWithGroq }   = require('./groq')
const { TemplateModel }      = require('../models/Template')

/**
 * Provider identifiers accepted in the API request body.
 * Front-end dropdown passes one of these values.
 */
const PROVIDERS = {
  GEMINI: 'gemini',
  GROQ:   'groq',
}

/**
 * Resolve which provider to use based on:
 * 1. The `provider` field in the request body (user's explicit choice)
 * 2. Which API keys are actually configured in .env
 * 3. Hard fallback order: Gemini → Groq
 *
 * @param {string|undefined} requestedProvider
 * @returns {'gemini'|'groq'}
 */
function resolveProvider(requestedProvider) {
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasGroq   = !!process.env.GROQ_API_KEY

  if (!hasGemini && !hasGroq) {
    throw new Error(
      'No AI provider configured. Add GEMINI_API_KEY or GROQ_API_KEY to your .env file.'
    )
  }

  // User explicitly asked for a provider
  if (requestedProvider === PROVIDERS.GEMINI) {
    if (!hasGemini) throw new Error('GEMINI_API_KEY is not set. Cannot use Gemini.')
    return PROVIDERS.GEMINI
  }
  if (requestedProvider === PROVIDERS.GROQ) {
    if (!hasGroq) throw new Error('GROQ_API_KEY is not set. Cannot use Groq.')
    return PROVIDERS.GROQ
  }

  // Auto-select: prefer Gemini, fall back to Groq
  return hasGemini ? PROVIDERS.GEMINI : PROVIDERS.GROQ
}

/**
 * Main entry point — generate test cases using the best available provider.
 * Automatically falls back to the secondary provider on failure.
 *
 * @param {{
 *   requirements:  string,
 *   fileName?:     string|null,
 *   fileContent?:  string|null,
 *   provider?:     'gemini'|'groq'|null,
 *   model?:        string|null,
 * }} options
 * @returns {Promise<{ testCases: Array, model: string, provider: string, meta: object }>}
 */
async function generate({ requirements, fileName, fileContent, provider, model, templateId }) {
  // Combine text input + file content
  const fullText = [requirements, fileContent].filter(Boolean).join('\n\n---\n\n')

  if (!fullText.trim()) {
    throw Object.assign(new Error('No content provided to generate test cases from.'), { status: 400 })
  }

  let template = null
  if (templateId) {
    try {
      template = await TemplateModel.findById(templateId)
    } catch (_e) { /* ignore */ }
  }

  const chosenProvider = resolveProvider(provider)

  try {
    let result

    if (chosenProvider === PROVIDERS.GEMINI) {
      result = await generateWithGemini(fullText, fileName, template)
    } else {
      result = await generateWithGroq(fullText, fileName, model, template)
    }

    return {
      ...result,
      meta: {
        source:      fileName ? 'file' : 'text',
        fileName:    fileName ?? null,
        charCount:   fullText.length,
        generatedAt: new Date().toISOString(),
        provider:    result.provider,
        model:       result.model,
      },
    }
  } catch (primaryError) {
    // Auto-fallback: if one provider fails, try the other (only when not explicitly chosen)
    if (!provider) {
      const fallbackProvider = chosenProvider === PROVIDERS.GEMINI ? PROVIDERS.GROQ : PROVIDERS.GEMINI
      const hasFallback = fallbackProvider === PROVIDERS.GEMINI
        ? !!process.env.GEMINI_API_KEY
        : !!process.env.GROQ_API_KEY

      if (hasFallback) {
        console.warn(`[AI] ${chosenProvider} failed (${primaryError.message}). Falling back to ${fallbackProvider}…`)
        try {
          let result
          if (fallbackProvider === PROVIDERS.GEMINI) {
            result = await generateWithGemini(fullText, fileName)
          } else {
            result = await generateWithGroq(fullText, fileName, model)
          }
          return {
            ...result,
            meta: {
              source:      fileName ? 'file' : 'text',
              fileName:    fileName ?? null,
              charCount:   fullText.length,
              generatedAt: new Date().toISOString(),
              provider:    result.provider,
              model:       result.model,
              fallback:    true,
            },
          }
        } catch (fallbackError) {
          throw new Error(
            `Both providers failed.\nPrimary (${chosenProvider}): ${primaryError.message}\nFallback (${fallbackProvider}): ${fallbackError.message}`
          )
        }
      }
    }

    throw primaryError
  }
}

/**
 * Generate completion text for a custom prompt using Gemini (or Groq fallback).
 * @param {string} userMessage
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
async function generateCustomPrompt(userMessage, systemPrompt) {
  const chosenProvider = resolveProvider()
  let lastErr = null

  if (chosenProvider === PROVIDERS.GEMINI) {
    try {
      const genAI = new (require('@google/generative-ai').GoogleGenerativeAI)(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      })
      const result = await model.generateContent(userMessage)
      let text = ''
      try {
        text = result.response.text()
      } catch {
        const candidate = result.response?.candidates?.[0]
        const part = candidate?.content?.parts?.find(p => p.text)
        text = part?.text || ''
      }
      if (text.trim()) return text.trim()
    } catch (err) {
      console.warn('[AI] Gemini custom completion warning:', err.message)
      lastErr = err
    }
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const Groq = require('groq-sdk')
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      })
      const text = completion.choices?.[0]?.message?.content ?? ''
      if (text.trim()) return text.trim()
    } catch (err) {
      console.warn('[AI] Groq custom completion warning:', err.message)
      lastErr = err
    }
  }

  throw lastErr || new Error('AI provider failed to generate completion.')
}

module.exports = { generate, generateCustomPrompt, PROVIDERS }
