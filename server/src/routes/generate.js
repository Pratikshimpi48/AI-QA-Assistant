'use strict'

const express    = require('express')
const router     = express.Router()
const { generate, PROVIDERS } = require('../services/aiProvider')

/**
 * POST /api/generate
 *
 * Request body:
 * {
 *   requirements:  string       — pasted requirement text
 *   fileName?:     string       — original file name (for context)
 *   fileContent?:  string       — extracted file text (.txt/.md/.csv)
 *   provider?:     'gemini'|'groq'  — optional explicit model choice
 *   model?:        string       — optional specific Groq model override
 * }
 *
 * Response:
 * {
 *   status:    'ok',
 *   testCases: Array<TestCase>,
 *   meta:      { source, fileName, charCount, generatedAt, provider, model, fallback? }
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      requirements = '',
      fileName,
      fileContent,
      provider,
      model,
    } = req.body

    // Basic validation
    if (!requirements.trim() && !fileContent) {
      return res.status(400).json({
        status:  'error',
        message: 'At least one of "requirements" or "fileContent" is required.',
      })
    }

    // Validate provider if explicitly supplied
    if (provider && !Object.values(PROVIDERS).includes(provider)) {
      return res.status(400).json({
        status:  'error',
        message: `Invalid provider "${provider}". Valid options: ${Object.values(PROVIDERS).join(', ')}`,
      })
    }

    const result = await generate({
      requirements,
      fileName,
      fileContent,
      provider,
      model,
    })

    return res.status(200).json({
      status:    'ok',
      testCases: result.testCases,
      meta:      result.meta,
    })
  } catch (err) {
    // Surface configuration errors with a helpful 503 (not 500)
    if (
      err.message?.includes('not set') ||
      err.message?.includes('not configured') ||
      err.message?.includes('No AI provider')
    ) {
      return res.status(503).json({
        status:  'error',
        message: err.message,
      })
    }
    next(err)
  }
})

/**
 * GET /api/generate/providers
 * Returns which AI providers are currently configured & available.
 */
router.get('/providers', (_req, res) => {
  res.json({
    status: 'ok',
    providers: [
      {
        id:          PROVIDERS.GEMINI,
        name:        'Google Gemini 2.0 Flash',
        available:   !!process.env.GEMINI_API_KEY,
        description: 'Fast, accurate — free via Google AI Studio',
      },
      {
        id:          PROVIDERS.GROQ,
        name:        'Groq (Llama 3.3 70B)',
        available:   !!process.env.GROQ_API_KEY,
        description: 'Ultra-fast Llama 3.3 70B — free via Groq Console',
      },
    ],
  })
})

module.exports = router
