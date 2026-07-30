'use strict'

const express = require('express')
const router  = express.Router()
const { TemplateModel } = require('../models/Template')
const { optionalAuth, authenticateToken } = require('../middleware/auth')

/**
 * GET /api/templates
 * Query params: ?type=test-cases|bug-report
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type } = req.query
    const templates = await TemplateModel.findByType(type)
    return res.json({
      status: 'success',
      count: templates.length,
      templates,
    })
  } catch (err) {
    console.error('[TemplateRoute] GET error:', err)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report templates.',
    })
  }
})

/**
 * GET /api/templates/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const template = await TemplateModel.findById(req.params.id)
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found.',
      })
    }
    return res.json({
      status: 'success',
      template,
    })
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch template details.',
    })
  }
})

/**
 * POST /api/templates
 * Create/upload custom template
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, description, structure } = req.body

    if (!name || !type || !structure) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, type (test-cases|bug-report), and structure are required.',
      })
    }

    if (!['test-cases', 'bug-report'].includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: 'Type must be either test-cases or bug-report.',
      })
    }

    const createdBy = req.user.name || req.user.email || 'User'
    const newTemplate = await TemplateModel.create({
      name,
      type,
      description,
      structure,
      createdBy,
    })

    return res.status(201).json({
      status: 'success',
      message: 'Report template created successfully.',
      template: newTemplate,
    })
  } catch (err) {
    console.error('[TemplateRoute] POST error:', err)
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Failed to create report template.',
    })
  }
})

/**
 * DELETE /api/templates/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await TemplateModel.delete(req.params.id)
    return res.json({
      status: 'success',
      message: 'Template deleted successfully.',
    })
  } catch (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Failed to delete template.',
    })
  }
})

module.exports = router
