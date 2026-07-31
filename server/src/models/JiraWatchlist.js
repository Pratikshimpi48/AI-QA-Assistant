'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore, saveDiskStore } = require('../config/db')

const watchlistSchema = new mongoose.Schema({
  userId:             { type: String, required: true, index: true },
  jiraTicketId:       { type: String, required: true },
  jiraBaseUrl:        { type: String, required: true },
  summary:            { type: String, default: '' },
  currentStatus:      { type: String, default: 'Unknown' },
  lastNotifiedStatus: { type: String, default: '' },
  lastChecked:        { type: Date,   default: null },
  notified:           { type: Boolean, default: false },
  isReleased:         { type: Boolean, default: false },
  createdAt:          { type: Date, default: Date.now },
})

const MongoWatchlist = mongoose.model('JiraWatchlist', watchlistSchema)

class JiraWatchlistModel {
  static _genId() {
    return 'wl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  }

  static async create({ userId, jiraTicketId, jiraBaseUrl, summary = '', currentStatus = 'Unknown' }) {
    const sUserId = String(userId)
    let mongoRec = null

    if (getIsMongoConnected()) {
      try {
        const rec = new MongoWatchlist({ userId: sUserId, jiraTicketId, jiraBaseUrl, summary, currentStatus })
        await rec.save()
        mongoRec = rec
      } catch (err) {
        console.warn('[JiraWatchlist] Mongo create error:', err.message)
      }
    }

    const id = mongoRec ? String(mongoRec._id) : this._genId()
    const memRec = {
      id, _id: id,
      userId: sUserId, jiraTicketId, jiraBaseUrl, summary, currentStatus,
      lastNotifiedStatus: '', lastChecked: null, notified: false, isReleased: false,
      createdAt: new Date().toISOString(),
    }

    memoryStore.watchlist.push(memRec)
    saveDiskStore()

    return mongoRec || memRec
  }

  static async findByUserId(userId) {
    const sUserId = String(userId)
    let mongoItems = []

    if (getIsMongoConnected()) {
      try {
        mongoItems = await MongoWatchlist.find({ userId: sUserId }).sort({ createdAt: -1 })
      } catch (err) {
        console.warn('[JiraWatchlist] Mongo find error:', err.message)
      }
    }

    const memItems = memoryStore.watchlist.filter(w => String(w.userId) === sUserId).reverse()

    // Merge Mongo items and memItems by ticketId (prefer Mongo)
    const map = new Map()
    for (const item of [...memItems, ...mongoItems]) {
      const key = item.jiraTicketId
      if (!map.has(key)) map.set(key, item)
    }

    return Array.from(map.values())
  }

  static async findAllActive() {
    let mongoActive = []

    if (getIsMongoConnected()) {
      try {
        mongoActive = await MongoWatchlist.find({ isReleased: { $ne: true } })
      } catch (err) { /* fallback */ }
    }

    const memActive = memoryStore.watchlist.filter(w => !w.isReleased)

    const map = new Map()
    for (const item of [...memActive, ...mongoActive]) {
      const key = item.id || item._id || item.jiraTicketId
      if (!map.has(key)) map.set(key, item)
    }

    return Array.from(map.values())
  }

  static async updateStatus(id, { summary, currentStatus, lastChecked, notified, lastNotifiedStatus, isReleased }) {
    const sId = String(id)
    let mongoUpdated = null

    const updateFields = { summary, currentStatus, lastChecked }
    if (notified !== undefined) updateFields.notified = notified
    if (lastNotifiedStatus !== undefined) updateFields.lastNotifiedStatus = lastNotifiedStatus
    if (isReleased !== undefined) updateFields.isReleased = isReleased

    if (getIsMongoConnected()) {
      try {
        mongoUpdated = await MongoWatchlist.findByIdAndUpdate(
          id,
          updateFields,
          { new: true }
        )
      } catch (err) { /* ignore */ }
    }

    const idx = memoryStore.watchlist.findIndex(w => w.id === sId || String(w._id) === sId)
    if (idx !== -1) {
      Object.assign(memoryStore.watchlist[idx], updateFields)
      saveDiskStore()
    }

    return mongoUpdated || (idx !== -1 ? memoryStore.watchlist[idx] : null)
  }

  static async deleteByIdAndUserId(id, userId) {
    const sId = String(id)
    const sUserId = String(userId)

    if (getIsMongoConnected()) {
      try {
        await MongoWatchlist.deleteOne({ _id: id, userId: sUserId })
      } catch (err) { /* ignore */ }
    }

    const idx = memoryStore.watchlist.findIndex(
      w => (w.id === sId || String(w._id) === sId) && String(w.userId) === sUserId
    )
    if (idx !== -1) {
      memoryStore.watchlist.splice(idx, 1)
      saveDiskStore()
      return true
    }
    return true
  }

  static async migrateGuestItems(targetUserId) {
    const sUserId = String(targetUserId)
    let count = 0

    if (getIsMongoConnected()) {
      try {
        const res = await MongoWatchlist.updateMany(
          { userId: 'guest_session' },
          { userId: sUserId }
        )
        count += (res.modifiedCount || 0)
      } catch (err) {
        console.warn('[JiraWatchlist] Mongo guest migration error:', err.message)
      }
    }

    memoryStore.watchlist.forEach(w => {
      if (w.userId === 'guest_session') {
        w.userId = sUserId
        count++
      }
    })

    if (count > 0) saveDiskStore()
    return count
  }
}

module.exports = JiraWatchlistModel
