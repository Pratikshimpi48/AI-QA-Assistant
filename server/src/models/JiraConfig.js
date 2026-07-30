'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore, saveDiskStore } = require('../config/db')

const jiraConfigSchema = new mongoose.Schema({
  userId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
  },
  jiraBaseUrl: { type: String, required: true },
  jiraEmail:   { type: String, required: true },
  jiraApiToken:{ type: String, required: true },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
})

const MongoJiraConfig = mongoose.model('JiraConfig', jiraConfigSchema)

class JiraConfigModel {
  static _genId() {
    return 'jcfg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  }

  static async findByUserId(userId) {
    if (!userId) return null
    let config = null

    if (getIsMongoConnected()) {
      try {
        config = await MongoJiraConfig.findOne({ userId: String(userId) })
      } catch (err) {
        console.warn('[JiraConfig] Mongo find error:', err.message)
      }
    }

    if (!config) {
      config = memoryStore.jiraConfigs.find(c => String(c.userId) === String(userId)) || null
    }

    return config
  }

  static async upsert(userId, { jiraBaseUrl, jiraEmail, jiraApiToken }) {
    const sUserId = String(userId)
    let mongoConfig = null

    if (getIsMongoConnected()) {
      try {
        mongoConfig = await MongoJiraConfig.findOneAndUpdate(
          { userId: sUserId },
          { jiraBaseUrl, jiraEmail, jiraApiToken, updatedAt: new Date() },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        )
      } catch (err) {
        console.warn('[JiraConfig] Mongo upsert error:', err.message)
      }
    }

    // Always keep memoryStore & disk in sync
    const idx = memoryStore.jiraConfigs.findIndex(c => String(c.userId) === sUserId)
    const rec = {
      id:           mongoConfig ? String(mongoConfig._id) : (idx !== -1 ? memoryStore.jiraConfigs[idx].id : this._genId()),
      _id:          mongoConfig ? String(mongoConfig._id) : (idx !== -1 ? memoryStore.jiraConfigs[idx]._id : this._genId()),
      userId:       sUserId,
      jiraBaseUrl,
      jiraEmail,
      jiraApiToken,
      createdAt:    idx !== -1 ? memoryStore.jiraConfigs[idx].createdAt : new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    }

    if (idx !== -1) {
      memoryStore.jiraConfigs[idx] = rec
    } else {
      memoryStore.jiraConfigs.push(rec)
    }

    saveDiskStore()
    return mongoConfig || rec
  }

  static async deleteByUserId(userId) {
    const sUserId = String(userId)
    if (getIsMongoConnected()) {
      try {
        await MongoJiraConfig.deleteOne({ userId: sUserId })
      } catch (err) { /* ignore */ }
    }

    const idx = memoryStore.jiraConfigs.findIndex(c => String(c.userId) === sUserId)
    if (idx !== -1) {
      memoryStore.jiraConfigs.splice(idx, 1)
      saveDiskStore()
      return true
    }
    return false
  }

  /** Strip the API token from returned config for safe frontend display */
  static sanitize(config) {
    if (!config) return null
    return {
      userId:      config.userId,
      jiraBaseUrl: config.jiraBaseUrl,
      jiraEmail:   config.jiraEmail,
      connected:   true,
      updatedAt:   config.updatedAt,
    }
  }
}

module.exports = JiraConfigModel
