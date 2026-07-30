'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore } = require('../config/db')

const notificationSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  type:          { type: String, enum: ['mr-merged', 'system'], default: 'mr-merged' },
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
    if (getIsMongoConnected()) {
      const notif = new MongoNotification({ userId: String(userId), type, title, message, jiraTicketId, jiraBaseUrl })
      await notif.save()
      return notif
    }
    const id = this._genId()
    const notif = {
      id, _id: id,
      userId: String(userId), type, title, message, jiraTicketId, jiraBaseUrl,
      read: false, createdAt: new Date().toISOString(),
    }
    memoryStore.notifications.unshift(notif)
    return notif
  }

  static async findByUserId(userId) {
    if (getIsMongoConnected()) {
      return await MongoNotification.find({ userId: String(userId) }).sort({ createdAt: -1 })
    }
    return memoryStore.notifications.filter(n => String(n.userId) === String(userId))
  }

  static async getUnreadCount(userId) {
    if (getIsMongoConnected()) {
      return await MongoNotification.countDocuments({ userId: String(userId), read: false })
    }
    return memoryStore.notifications.filter(n => String(n.userId) === String(userId) && !n.read).length
  }

  static async markAsRead(id, userId) {
    if (getIsMongoConnected()) {
      const res = await MongoNotification.findOneAndUpdate(
        { _id: id, userId: String(userId) },
        { read: true },
        { new: true },
      )
      return !!res
    }
    const notif = memoryStore.notifications.find(n => (n.id === id || String(n._id) === String(id)) && String(n.userId) === String(userId))
    if (notif) { notif.read = true; return true }
    return false
  }

  static async markAllAsRead(userId) {
    if (getIsMongoConnected()) {
      await MongoNotification.updateMany({ userId: String(userId), read: false }, { read: true })
      return true
    }
    memoryStore.notifications
      .filter(n => String(n.userId) === String(userId))
      .forEach(n => { n.read = true })
    return true
  }
}

module.exports = NotificationModel
