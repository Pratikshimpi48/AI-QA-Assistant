'use strict'

const express      = require('express')
const router       = express.Router()
const HistoryModel = require('../models/History')
const { authenticateToken } = require('../middleware/auth')

/**
 * GET /api/history
 * Protected - fetch history for current user
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const history = await HistoryModel.findByUserId(req.user.id)
    res.json({
      status:  'ok',
      history,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/history/:id
 * Protected - delete specific history record belonging to current user
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    const success = await HistoryModel.deleteByIdAndUserId(id, req.user.id)

    if (!success) {
      return res.status(404).json({
        status:  'error',
        message: 'History item not found or you do not have permission to delete it.',
      })
    }

    res.json({
      status:  'ok',
      message: 'History item deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
