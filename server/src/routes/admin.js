'use strict'

const express = require('express')
const router  = express.Router()
const UserModel = require('../models/User')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

/**
 * GET /api/admin/users
 * List all users (Admin only)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await UserModel.getAllUsers()
    return res.json({
      status: 'success',
      count: users.length,
      users,
    })
  } catch (err) {
    console.error('[AdminRoute] GET /users error:', err)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch registered users.',
    })
  }
})

/**
 * PUT /api/admin/users/:id/role
 * Update user role (Admin only)
 */
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body
    const userId = req.params.id

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be admin or user.',
      })
    }

    const updatedUser = await UserModel.updateUserRole(userId, role)
    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.',
      })
    }

    return res.json({
      status: 'success',
      message: `User role updated to ${updatedUser.role}.`,
      user: updatedUser,
    })
  } catch (err) {
    console.error('[AdminRoute] PUT /users/:id/role error:', err)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user role.',
    })
  }
})

module.exports = router
