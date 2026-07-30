'use strict'

const express    = require('express')
const router     = express.Router()
const { generate, PROVIDERS } = require('../services/aiProvider')

const { optionalAuth } = require('../middleware/auth')
const HistoryModel    = require('../models/History')

/**
 * POST /api/generate
 */
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      requirements = '',
      fileName,
      fileContent,
      provider,
      model,
      targetCount,
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
      targetCount,
    })

    // Save to user history if authenticated
    if (req.user) {
      const title = fileName ? `File: ${fileName}` : `Test Suite (${result.testCases.length} Cases)`
      await HistoryModel.create({
        userId: req.user.id,
        type:   'test-cases',
        title,
        data:   result.testCases,
        meta:   result.meta,
      })
    }

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
        name:        'Google Gemini Flash',
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
