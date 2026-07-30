'use strict'

const mongoose = require('mongoose')
const env      = require('./env')

let isMongoConnected = false

// In-memory fallback database store
const memoryStore = {
  users:         [],  // { id, name, email, password, dob, createdAt }
  history:       [],  // { id, userId, type, title, data, meta, createdAt }
  jiraConfigs:   [],  // { id, userId, jiraBaseUrl, jiraEmail, jiraApiToken, createdAt }
  watchlist:     [],  // { id, userId, jiraTicketId, projectKey, summary, status, lastChecked, notified, createdAt }
  notifications: [],  // { id, userId, type, title, message, jiraTicketId, read, createdAt }
}

async function connectDB() {
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    })
    isMongoConnected = true
    console.log('✅ MongoDB connected successfully')
  } catch (err) {
    isMongoConnected = false
    console.warn(`⚠️ MongoDB connection failed (${err.message}). Using fast in-memory database fallback.`)
  }
}

function getIsMongoConnected() {
  return isMongoConnected
}

module.exports = {
  connectDB,
  getIsMongoConnected,
  memoryStore,
}
