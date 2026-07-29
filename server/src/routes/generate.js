'use strict'

const express = require('express')
const router  = express.Router()

/**
 * POST /api/generate
 *
 * Receives: { requirements: string, fileName?: string, fileContent?: string }
 * Returns:  { status, testCases, meta }
 *
 * Story 6 stub — real Gemini AI integration comes in Story 4 (backend story).
 */
router.post('/', async (req, res, next) => {
  try {
    const { requirements = '', fileName, fileContent } = req.body

    if (!requirements.trim() && !fileContent) {
      return res.status(400).json({
        status:  'error',
        message: 'At least one of "requirements" or "fileContent" is required.',
      })
    }

    /* ──────────────────────────────────────────────────────
       TODO (Story 4): Replace this stub with a real Gemini call
       ────────────────────────────────────────────────────── */
    const stubTestCases = [
      {
        id:          'TC-001',
        title:       'Valid input produces expected output',
        type:        'Positive',
        steps:       ['Provide valid input', 'Submit the form', 'Observe the result'],
        expected:    'System processes input successfully and shows confirmation.',
        priority:    'High',
      },
      {
        id:          'TC-002',
        title:       'Empty input is rejected',
        type:        'Negative',
        steps:       ['Leave all fields empty', 'Submit the form'],
        expected:    'Validation error is displayed. No request is sent to the server.',
        priority:    'High',
      },
      {
        id:          'TC-003',
        title:       'Boundary value at maximum length',
        type:        'Edge Case',
        steps:       ['Enter input at exactly the maximum allowed length', 'Submit the form'],
        expected:    'System accepts the input and processes it correctly.',
        priority:    'Medium',
      },
    ]

    return res.status(200).json({
      status: 'ok',
      meta: {
        source:      fileName ? 'file' : 'text',
        fileName:    fileName ?? null,
        charCount:   (requirements + (fileContent ?? '')).length,
        generatedAt: new Date().toISOString(),
        model:       'stub (Gemini integration pending)',
      },
      testCases: stubTestCases,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
