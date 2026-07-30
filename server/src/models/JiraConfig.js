'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore } = require('../config/db')

const jiraConfigSchema = new mongoose.Schema({
  userId: {
    type:     String,
    required: true,
    unique:   true,
    index:    true,
  },
  jiraBaseUrl: { type: String, required: true },  // e.g. https://yourcompany.atlassian.net
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
    if (getIsMongoConnected()) {
      return await MongoJiraConfig.findOne({ userId: String(userId) })
    }
    return memoryStore.jiraConfigs.find(c => String(c.userId) === String(userId)) || null
  }

  static async upsert(userId, { jiraBaseUrl, jiraEmail, jiraApiToken }) {
    if (getIsMongoConnected()) {
      return await MongoJiraConfig.findOneAndUpdate(
        { userId: String(userId) },
        { jiraBaseUrl, jiraEmail, jiraApiToken, updatedAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
    }
    // In-memory upsert
    const idx = memoryStore.jiraConfigs.findIndex(c => String(c.userId) === String(userId))
    if (idx !== -1) {
      memoryStore.jiraConfigs[idx] = {
        ...memoryStore.jiraConfigs[idx],
        jiraBaseUrl, jiraEmail, jiraApiToken,
        updatedAt: new Date().toISOString(),
      }
      return memoryStore.jiraConfigs[idx]
    }
    const record = {
      id: this._genId(), _id: this._genId(),
      userId: String(userId),
      jiraBaseUrl, jiraEmail, jiraApiToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    memoryStore.jiraConfigs.push(record)
    return record
  }

  static async deleteByUserId(userId) {
    if (getIsMongoConnected()) {
      const res = await MongoJiraConfig.deleteOne({ userId: String(userId) })
      return res.deletedCount > 0
    }
    const idx = memoryStore.jiraConfigs.findIndex(c => String(c.userId) === String(userId))
    if (idx !== -1) { memoryStore.jiraConfigs.splice(idx, 1); return true }
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
