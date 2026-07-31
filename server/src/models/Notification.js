'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore, saveDiskStore } = require('../config/db')

const notificationSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  type:          { type: String, default: 'status-changed' },
  title:         { type: String, required: true },
  message:       { type: String, required: true },
  jiraTicketId:  { type: String, default: '' },
  jiraBaseUrl:   { type: String, default: '' },
  read:          { type: Boolean, default: false },
  createdAt:     { type: Date, default: Date.now },
})

const MongoNotification = mongoose.model('Notification', notificationSchema)

class NotificationModel {
  static _genId() {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  }

  static async create({ userId, type = 'mr-merged', title, message, jiraTicketId = '', jiraBaseUrl = '' }) {
    const sUserId = String(userId)
    let mongoNotif = null

    if (getIsMongoConnected()) {
      try {
        const notif = new MongoNotification({ userId: sUserId, type, title, message, jiraTicketId, jiraBaseUrl })
        await notif.save()
        mongoNotif = notif
      } catch (err) {
        console.warn('[Notification] Mongo create error:', err.message)
      }
    }

    const id = mongoNotif ? String(mongoNotif._id) : this._genId()
    const memNotif = {
      id, _id: id,
      userId: sUserId, type, title, message, jiraTicketId, jiraBaseUrl,
      read: false, createdAt: new Date().toISOString(),
    }

    memoryStore.notifications.unshift(memNotif)
    saveDiskStore()

    return mongoNotif || memNotif
  }

  static async findByUserId(userId) {
    const sUserId = String(userId)
    let mongoItems = []

    if (getIsMongoConnected()) {
      try {
        mongoItems = await MongoNotification.find({ userId: sUserId }).sort({ createdAt: -1 })
      } catch (err) { /* ignore */ }
    }

    const memItems = memoryStore.notifications.filter(n => String(n.userId) === sUserId)

    const map = new Map()
    for (const item of [...memItems, ...mongoItems]) {
      const key = item.id || item._id || String(item._id)
      if (!map.has(key)) map.set(key, item)
    }

    return Array.from(map.values())
  }

  static async getUnreadCount(userId) {
    const sUserId = String(userId)
    const items = await this.findByUserId(sUserId)
    return items.filter(n => !n.read).length
  }

  static async markAsRead(id, userId) {
    const sId = String(id)
    const sUserId = String(userId)

    if (getIsMongoConnected()) {
      try {
        await MongoNotification.findOneAndUpdate({ _id: id, userId: sUserId }, { read: true })
      } catch (err) { /* ignore */ }
    }

    const notif = memoryStore.notifications.find(n => (n.id === sId || String(n._id) === sId) && String(n.userId) === sUserId)
    if (notif) {
      notif.read = true
      saveDiskStore()
    }
    return true
  }

  static async markAllAsRead(userId) {
    const sUserId = String(userId)

    if (getIsMongoConnected()) {
      try {
        await MongoNotification.updateMany({ userId: sUserId, read: false }, { read: true })
      } catch (err) { /* ignore */ }
    }

    memoryStore.notifications.forEach(n => {
      if (String(n.userId) === sUserId) n.read = true
    })
    saveDiskStore()
    return true
  }
}

module.exports = NotificationModel
