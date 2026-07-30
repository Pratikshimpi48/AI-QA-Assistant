'use strict'

const express    = require('express')
const jwt        = require('jsonwebtoken')
const router     = express.Router()
const env        = require('../config/env')
const UserModel  = require('../models/User')
const HistoryModel = require('../models/History')
const { authenticateToken } = require('../middleware/auth')

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Generate JWT Token helper
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id || user._id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, dob } = req.body

    // Validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Full name is required.' })
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters long.' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Password and Confirm Password do not match.' })
    }

    if (!dob || isNaN(Date.parse(dob))) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid Date of Birth.' })
    }

    // Check duplicate account
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        status:  'error',
        message: 'An account with this email address already exists. Please log in instead.',
      })
    }

    // Create user
    const newUser = await UserModel.create({
      name,
      email,
      password,
      dob,
    })

    const formattedUser = UserModel.formatUser(newUser)
    const token         = generateToken(formattedUser)

    return res.status(201).json({
      status:  'ok',
      message: 'Account registered successfully!',
      token,
      user: formattedUser,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status:  'error',
        message: 'Email and password are required.',
      })
    }

    const user = await UserModel.findByEmail(email)
    if (!user) {
      return res.status(401).json({
        status:  'error',
        message: 'Invalid email or password.',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        status:  'error',
        message: 'Invalid email or password.',
      })
    }

    const formattedUser = UserModel.formatUser(user)
    const token         = generateToken(formattedUser)

    return res.status(200).json({
      status:  'ok',
      message: 'Logged in successfully!',
      token,
      user: formattedUser,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/auth/me
 * Protected - Get current user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    status: 'ok',
    user:   req.user,
  })
})

/**
 * GET /api/auth/dashboard-stats
 * Protected - Get user personalized dashboard metrics
 */
router.get('/dashboard-stats', authenticateToken, async (req, res, next) => {
  try {
    const stats = await HistoryModel.getStatsForUser(req.user.id)
    return res.json({
      status: 'ok',
      user:   req.user,
      stats,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/auth/profile
 * Protected - Update name, email, date of birth
 */
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, email, dob } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Full name is required.' })
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' })
    }

    if (!dob || isNaN(Date.parse(dob))) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid Date of Birth.' })
    }

    // Check if new email belongs to another registered user
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser && String(existingUser.id || existingUser._id) !== String(req.user.id)) {
      return res.status(409).json({
        status:  'error',
        message: 'An account with this email address already exists. Please choose a different email.',
      })
    }

    const updatedUser = await UserModel.updateProfile(req.user.id, { name, email, dob })
    const formattedUser = UserModel.formatUser(updatedUser)

    return res.json({
      status:  'ok',
      message: 'Profile details updated successfully!',
      user:    formattedUser,
    })
  } catch (err) {
    next(err)
  }
})

/**
 * PUT /api/auth/password
 * Protected - Update account password
 */
router.put('/password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Current password and new password are required.' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters long.' })
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ status: 'error', message: 'New password and confirm password do not match.' })
    }

    // Fetch full user record (with password field)
    const user = await UserModel.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User account not found.' })
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Current password is incorrect.' })
    }

    await UserModel.updatePassword(req.user.id, newPassword)

    return res.json({
      status:  'ok',
      message: 'Password changed successfully!',
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
