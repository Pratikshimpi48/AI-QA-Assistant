'use strict'

const mongoose = require('mongoose')
const fs       = require('fs')
const path     = require('path')
const env      = require('./env')

let isMongoConnected = false

const DB_FILE_PATH = path.join(__dirname, '../../data/memory_db.json')

// In-memory database store
const memoryStore = {
  users:         [],  // { id, name, email, password, dob, createdAt }
  history:       [],  // { id, userId, type, title, data, meta, createdAt }
  jiraConfigs:   [],  // { id, userId, jiraBaseUrl, jiraEmail, jiraApiToken, createdAt }
  watchlist:     [],  // { id, userId, jiraTicketId, summary, currentStatus, lastChecked, notified, createdAt }
  notifications: [],  // { id, userId, type, title, message, jiraTicketId, read, createdAt }
  worklogs:      [],  // { id, userId, jiraTicketId, summary, timeSpent, worklogSummary, formattedJiraWorklog, createdAt }
}

/** Load fallback database from disk if file exists */
function loadDiskStore() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8')
      if (!raw || !raw.trim()) return
      const data = JSON.parse(raw)
      memoryStore.users         = Array.isArray(data.users) ? data.users : []
      memoryStore.history       = Array.isArray(data.history) ? data.history : []
      memoryStore.jiraConfigs   = Array.isArray(data.jiraConfigs) ? data.jiraConfigs : []
      memoryStore.watchlist     = Array.isArray(data.watchlist) ? data.watchlist : []
      memoryStore.notifications = Array.isArray(data.notifications) ? data.notifications : []
      memoryStore.worklogs      = Array.isArray(data.worklogs) ? data.worklogs : []
      console.log(`📦 Loaded ${memoryStore.users.length} user(s) & local data from memory_db.json`)
    }
  } catch (err) {
    console.warn('⚠️ Could not load memory_db.json (starting clean):', err.message)
  }
}

/** Save in-memory store to disk safely (atomic write via temp file) */
function saveDiskStore() {
  try {
    const dir = path.dirname(DB_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const serializable = {
      users: (memoryStore.users || []).map(u => ({
        id: u.id || u._id,
        _id: u._id || u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        dob: u.dob,
        createdAt: u.createdAt,
      })),
      history:       memoryStore.history || [],
      jiraConfigs:   memoryStore.jiraConfigs || [],
      watchlist:     memoryStore.watchlist || [],
      notifications: memoryStore.notifications || [],
      worklogs:      memoryStore.worklogs || [],
    }

    const tmpFile = DB_FILE_PATH + '.tmp'
    fs.writeFileSync(tmpFile, JSON.stringify(serializable, null, 2), 'utf8')
    fs.renameSync(tmpFile, DB_FILE_PATH)
  } catch (err) {
    console.warn('⚠️ Could not save to memory_db.json:', err.message)
  }
}

async function connectDB() {
  // Load saved local data on boot
  loadDiskStore()

  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    })
    isMongoConnected = true
    console.log('✅ MongoDB connected successfully')
  } catch (err) {
    isMongoConnected = false
    console.warn(`⚠️ MongoDB not connected (${err.message}). Using persistent local store fallback.`)
  }
}

function getIsMongoConnected() {
  return isMongoConnected
}

module.exports = {
  connectDB,
  getIsMongoConnected,
  memoryStore,
  saveDiskStore,
}
