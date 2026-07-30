'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore } = require('../config/db')

const historySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['test-cases', 'bug-report'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const MongoHistory = mongoose.model('History', historySchema)

class HistoryModel {
  static async create({ userId, type, title, data, meta = {} }) {
    if (getIsMongoConnected()) {
      const record = new MongoHistory({
        userId,
        type,
        title,
        data,
        meta,
      })
      await record.save()
      return record
    } else {
      const id = 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
      const record = {
        id,
        _id: id,
        userId: String(userId),
        type,
        title,
        data,
        meta,
        createdAt: new Date().toISOString(),
      }
      memoryStore.history.unshift(record)
      return record
    }
  }

  static async findByUserId(userId) {
    if (getIsMongoConnected()) {
      return await MongoHistory.find({ userId }).sort({ createdAt: -1 })
    } else {
      return memoryStore.history.filter(h => String(h.userId) === String(userId))
    }
  }

  static async deleteByIdAndUserId(id, userId) {
    if (getIsMongoConnected()) {
      const res = await MongoHistory.deleteOne({ _id: id, userId })
      return res.deletedCount > 0
    } else {
      const idx = memoryStore.history.findIndex(h => (h.id === id || String(h._id) === String(id)) && String(h.userId) === String(userId))
      if (idx !== -1) {
        memoryStore.history.splice(idx, 1)
        return true
      }
      return false
    }
  }

  static async getStatsForUser(userId) {
    const userRecords = await this.findByUserId(userId)
    
    let totalTestRuns = 0
    let totalTestCases = 0
    let totalBugReports = 0

    userRecords.forEach(rec => {
      if (rec.type === 'test-cases') {
        totalTestRuns += 1
        if (Array.isArray(rec.data)) {
          totalTestCases += rec.data.length
        }
      } else if (rec.type === 'bug-report') {
        totalBugReports += 1
      }
    })

    // Estimated hours saved (approx 0.5 hours per test case/bug report generated)
    const hoursSaved = Math.round((totalTestCases * 0.5 + totalBugReports * 0.75) * 10) / 10

    return {
      totalTestRuns,
      totalTestCases,
      totalBugReports,
      hoursSaved,
      recentActivity: userRecords.slice(0, 5),
    }
  }
}

module.exports = HistoryModel
