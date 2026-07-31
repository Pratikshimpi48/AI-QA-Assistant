'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore, saveDiskStore } = require('../config/db')

const worklogSchema = new mongoose.Schema({
  userId:               { type: String, required: true, index: true },
  jiraTicketId:         { type: String, required: true },
  jiraBaseUrl:          { type: String, default: '' },
  summary:              { type: String, default: '' },
  timeSpent:            { type: String, default: '' },
  worklogSummary:       { type: String, required: true },
  bulletPoints:         { type: [String], default: [] },
  formattedJiraWorklog: { type: String, default: '' },
  createdAt:            { type: Date, default: Date.now },
})

const MongoWorklog = mongoose.model('Worklog', worklogSchema)

class WorklogModel {
  static _genId() {
    return 'wl_log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  }

  static async create({ userId, jiraTicketId, jiraBaseUrl = '', summary = '', timeSpent = '', worklogSummary, bulletPoints = [], formattedJiraWorklog = '' }) {
    const sUserId = String(userId)
    let mongoRec = null

    if (getIsMongoConnected()) {
      try {
        const rec = new MongoWorklog({
          userId: sUserId,
          jiraTicketId,
          jiraBaseUrl,
          summary,
          timeSpent,
          worklogSummary,
          bulletPoints,
          formattedJiraWorklog,
        })
        await rec.save()
        mongoRec = rec
      } catch (err) {
        console.warn('[WorklogModel] Mongo create error:', err.message)
      }
    }

    const id = mongoRec ? String(mongoRec._id) : this._genId()
    const memRec = {
      id, _id: id,
      userId: sUserId,
      jiraTicketId,
      jiraBaseUrl,
      summary,
      timeSpent,
      worklogSummary,
      bulletPoints,
      formattedJiraWorklog,
      createdAt: new Date().toISOString(),
    }

    memoryStore.worklogs.unshift(memRec)
    saveDiskStore()

    return mongoRec || memRec
  }

  static async findByUserId(userId) {
    const sUserId = String(userId)
    let mongoItems = []

    if (getIsMongoConnected()) {
      try {
        mongoItems = await MongoWorklog.find({ userId: sUserId }).sort({ createdAt: -1 })
      } catch (err) {
        console.warn('[WorklogModel] Mongo find error:', err.message)
      }
    }

    const memItems = memoryStore.worklogs.filter(w => String(w.userId) === sUserId)

    const map = new Map()
    for (const item of [...memItems, ...mongoItems]) {
      const key = String(item.id || item._id)
      if (!map.has(key)) map.set(key, item)
    }

    return Array.from(map.values())
  }

  static async deleteByIdAndUserId(id, userId) {
    const sId = String(id)
    const sUserId = String(userId)

    if (getIsMongoConnected()) {
      try {
        await MongoWorklog.deleteOne({ _id: id, userId: sUserId })
      } catch (err) { /* ignore */ }
    }

    const idx = memoryStore.worklogs.findIndex(
      w => (w.id === sId || String(w._id) === sId) && String(w.userId) === sUserId
    )
    if (idx !== -1) {
      memoryStore.worklogs.splice(idx, 1)
      saveDiskStore()
    }
    return true
  }
}

module.exports = WorklogModel
