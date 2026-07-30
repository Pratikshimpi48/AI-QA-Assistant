'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore } = require('../config/db')

const watchlistSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  jiraTicketId:  { type: String, required: true },   // e.g. "QA-145"
  jiraBaseUrl:   { type: String, required: true },   // user's jira instance URL
  summary:       { type: String, default: '' },      // fetched from Jira on first check
  currentStatus: { type: String, default: 'Unknown' },
  lastChecked:   { type: Date,   default: null },
  notified:      { type: Boolean, default: false },  // true once MR-ready notification sent
  createdAt:     { type: Date, default: Date.now },
})

const MongoWatchlist = mongoose.model('JiraWatchlist', watchlistSchema)

class JiraWatchlistModel {
  static _genId() {
    return 'wl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  }

  static async create({ userId, jiraTicketId, jiraBaseUrl, summary = '', currentStatus = 'Unknown' }) {
    if (getIsMongoConnected()) {
      const rec = new MongoWatchlist({ userId: String(userId), jiraTicketId, jiraBaseUrl, summary, currentStatus })
      await rec.save()
      return rec
    }
    const id = this._genId()
    const rec = {
      id, _id: id,
      userId: String(userId), jiraTicketId, jiraBaseUrl, summary, currentStatus,
      lastChecked: null, notified: false,
      createdAt: new Date().toISOString(),
    }
    memoryStore.watchlist.push(rec)
    return rec
  }

  static async findByUserId(userId) {
    if (getIsMongoConnected()) {
      return await MongoWatchlist.find({ userId: String(userId) }).sort({ createdAt: -1 })
    }
    return memoryStore.watchlist.filter(w => String(w.userId) === String(userId)).reverse()
  }

  static async findAllActive() {
    // Returns all watchlist items where notified === false (still being monitored)
    if (getIsMongoConnected()) {
      return await MongoWatchlist.find({ notified: false })
    }
    return memoryStore.watchlist.filter(w => !w.notified)
  }

  static async updateStatus(id, { summary, currentStatus, lastChecked, notified }) {
    if (getIsMongoConnected()) {
      return await MongoWatchlist.findByIdAndUpdate(id, { summary, currentStatus, lastChecked, notified }, { new: true })
    }
    const idx = memoryStore.watchlist.findIndex(w => w.id === id || String(w._id) === String(id))
    if (idx !== -1) {
      Object.assign(memoryStore.watchlist[idx], { summary, currentStatus, lastChecked, notified })
      return memoryStore.watchlist[idx]
    }
    return null
  }

  static async deleteByIdAndUserId(id, userId) {
    if (getIsMongoConnected()) {
      const res = await MongoWatchlist.deleteOne({ _id: id, userId: String(userId) })
      return res.deletedCount > 0
    }
    const idx = memoryStore.watchlist.findIndex(w => (w.id === id || String(w._id) === String(id)) && String(w.userId) === String(userId))
    if (idx !== -1) { memoryStore.watchlist.splice(idx, 1); return true }
    return false
  }
}

module.exports = JiraWatchlistModel
