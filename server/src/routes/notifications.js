'use strict'

const express               = require('express')
const router                = express.Router()
const { authenticateToken } = require('../middleware/auth')
const NotificationModel     = require('../models/Notification')

/**
 * GET /api/notifications — get all user notifications (newest first)
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const notifications = await NotificationModel.findByUserId(req.user.id)
    return res.json({ status: 'ok', notifications })
  } catch (err) { next(err) }
})

/**
 * GET /api/notifications/unread-count — get unread badge count
 */
router.get('/unread-count', authenticateToken, async (req, res, next) => {
  try {
    const count = await NotificationModel.getUnreadCount(req.user.id)
    return res.json({ status: 'ok', count })
  } catch (err) { next(err) }
})

/**
 * PATCH /api/notifications/read-all — mark all as read
 */
router.patch('/read-all', authenticateToken, async (req, res, next) => {
  try {
    await NotificationModel.markAllAsRead(req.user.id)
    return res.json({ status: 'ok', message: 'All notifications marked as read.' })
  } catch (err) { next(err) }
})

/**
 * PATCH /api/notifications/:id/read — mark one notification as read
 */
router.patch('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const ok = await NotificationModel.markAsRead(req.params.id, req.user.id)
    if (!ok) return res.status(404).json({ status: 'error', message: 'Notification not found.' })
    return res.json({ status: 'ok', message: 'Notification marked as read.' })
  } catch (err) { next(err) }
})

module.exports = router
