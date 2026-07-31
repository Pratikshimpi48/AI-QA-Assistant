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
 * POST /api/history/sync-guest
 * Protected - Migrate guest session history items to user account
 */
router.post('/sync-guest', authenticateToken, async (req, res, next) => {
  try {
    const { items = [] } = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ status: 'ok', count: 0, message: 'No guest items to sync.' })
    }

    let syncedCount = 0
    for (const item of items) {
      if (item && item.type && item.title && item.data) {
        await HistoryModel.create({
          userId: req.user.id,
          type:   item.type,
          title:  item.title,
          data:   item.data,
          meta:   item.meta || {},
        })
        syncedCount++
      }
    }

    const updatedHistory = await HistoryModel.findByUserId(req.user.id)
    return res.json({
      status:  'ok',
      count:   syncedCount,
      history: updatedHistory,
      message: `Successfully migrated ${syncedCount} guest item(s) to your account.`,
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
