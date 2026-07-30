'use strict'

const jwt       = require('jsonwebtoken')
const env       = require('../config/env')
const UserModel = require('../models/User')

/**
 * Require authenticated user middleware
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization']
    const token      = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        status:  'error',
        message: 'Access denied. Authentication token required.',
      })
    }

    const decoded = jwt.verify(token, env.JWT_SECRET)
    const user    = await UserModel.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        status:  'error',
        message: 'Invalid token. User no longer exists.',
      })
    }

    req.user = UserModel.formatUser(user)
    next()
  } catch (err) {
    return res.status(401).json({
      status:  'error',
      message: 'Invalid or expired token. Please log in again.',
    })
  }
}

/**
 * Optional authentication middleware - attaches req.user if valid token present, otherwise null
 */
async function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers['authorization']
    const token      = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET)
      const user    = await UserModel.findById(decoded.id)
      if (user) {
        req.user = UserModel.formatUser(user)
      }
    }
  } catch (_e) {
    // Ignore error in optional auth
  }
  next()
}

/**
 * Require administrator role middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      status:  'error',
      message: 'Access denied. Administrator privileges required.',
    })
  }
  next()
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
}
