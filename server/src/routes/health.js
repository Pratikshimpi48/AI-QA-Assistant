'use strict'

const { Router } = require('express')

const router = Router()

/**
 * GET /api/health
 * Returns service health status and basic metadata.
 */
router.get('/', (req, res) => {
  res.json({
    status:      'ok',
    message:     'AI QA Assistant API is running',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version:     '1.0.0',
  })
})

module.exports = router
