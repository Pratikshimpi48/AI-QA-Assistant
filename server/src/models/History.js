'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore, saveDiskStore } = require('../config/db')

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
    const sUserId = String(userId)
    let mongoRecord = null

    if (getIsMongoConnected()) {
      try {
        const record = new MongoHistory({ userId: sUserId, type, title, data, meta })
        await record.save()
        mongoRecord = record
      } catch (err) {
        console.warn('[History] Mongo create error:', err.message)
      }
    }

    const id = mongoRecord ? String(mongoRecord._id) : ('hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5))
    const memRecord = {
      id, _id: id,
      userId: sUserId, type, title, data, meta,
      createdAt: new Date().toISOString(),
    }

    memoryStore.history.unshift(memRecord)
    saveDiskStore()

    return mongoRecord || memRecord
  }

  static async findByUserId(userId) {
    const sUserId = String(userId)
    let mongoRecords = []

    if (getIsMongoConnected()) {
      try {
        mongoRecords = await MongoHistory.find({ userId: sUserId }).sort({ createdAt: -1 })
      } catch (err) {
        console.warn('[History] Mongo find error:', err.message)
      }
    }

    const memRecords = memoryStore.history.filter(h => String(h.userId) === sUserId)

    const map = new Map()
    for (const item of [...memRecords, ...mongoRecords]) {
      const key = item.id || item._id || String(item._id)
      if (!map.has(key)) map.set(key, item)
    }

    return Array.from(map.values())
  }

  static async deleteByIdAndUserId(id, userId) {
    const sId = String(id)
    const sUserId = String(userId)

    if (getIsMongoConnected()) {
      try {
        await MongoHistory.deleteOne({ _id: id, userId: sUserId })
      } catch (err) { /* ignore */ }
    }

    const idx = memoryStore.history.findIndex(h => (h.id === sId || String(h._id) === sId) && String(h.userId) === sUserId)
    if (idx !== -1) {
      memoryStore.history.splice(idx, 1)
      saveDiskStore()
    }
    return true
  }

  static async getStatsForUser(userId) {
    const records = await this.findByUserId(userId)

    let totalTestCases = 0
    let totalBugReports = 0
    let tokensUsed = 0

    records.forEach(r => {
      if (r.meta?.tokensUsed) {
        tokensUsed += Number(r.meta.tokensUsed)
      } else if (r.type === 'test-cases') {
        const count = Array.isArray(r.data?.testCases)
          ? r.data.testCases.length
          : (Array.isArray(r.data) ? r.data.length : 5)
        totalTestCases += count
        tokensUsed += Math.max(420, count * 130 + 280)
      } else if (r.type === 'bug-report') {
        totalBugReports += 1
        tokensUsed += 480
      }
    })

    const hoursSaved = Math.round((totalTestCases * 0.25 + totalBugReports * 0.3) * 10) / 10

    return {
      totalTestRuns:   records.filter(r => r.type === 'test-cases').length,
      totalTestCases,
      totalBugReports,
      hoursSaved,
      tokensUsed,
      recentActivity:  records.slice(0, 5),
    }
  }
}

module.exports = HistoryModel
