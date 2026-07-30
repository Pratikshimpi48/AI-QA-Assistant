'use strict'

const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const { getIsMongoConnected, memoryStore, saveDiskStore } = require('../config/db')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Password comparison helper for Mongoose
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const MongoUser = mongoose.model('User', userSchema)

class UserModel {
  static attachComparePassword(user) {
    if (!user) return null
    if (!user.comparePassword) {
      user.comparePassword = async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password)
      }
    }
    return user
  }

  static async findByEmail(email) {
    if (!email) return null
    const cleanEmail = email.toLowerCase().trim()
    let user = null

    // Check MongoDB first if connected
    if (getIsMongoConnected()) {
      try {
        user = await MongoUser.findOne({ email: cleanEmail })
      } catch (err) {
        console.warn('[UserModel] Mongo findByEmail error:', err.message)
      }
    }

    // Fallback to local memoryStore / disk store if Mongo didn't return a record
    if (!user) {
      user = memoryStore.users.find(u => u.email && u.email.toLowerCase() === cleanEmail) || null
    }

    return this.attachComparePassword(user)
  }

  static async findById(id) {
    if (!id) return null
    let user = null

    if (getIsMongoConnected()) {
      try {
        user = await MongoUser.findById(id)
      } catch (err) {
        // Mongo ObjectId parse error or disconnect
      }
    }

    if (!user) {
      user = memoryStore.users.find(
        u => u.id === id || u._id === id || String(u.id) === String(id) || String(u._id) === String(id)
      ) || null
    }

    return this.attachComparePassword(user)
  }

  static async create({ name, email, password, dob }) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const cleanEmail = email.toLowerCase().trim()
    const now = new Date()

    let mongoUser = null

    // Save to MongoDB if connected
    if (getIsMongoConnected()) {
      try {
        mongoUser = new MongoUser({
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          dob: new Date(dob),
        })
        await mongoUser.save()
      } catch (err) {
        console.warn('[UserModel] Mongo save error:', err.message)
      }
    }

    // ALWAYS also save/sync to memoryStore + disk so account works seamlessly in both places
    const id = mongoUser ? String(mongoUser._id) : ('usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5))

    const memUser = {
      id,
      _id: id,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      dob: new Date(dob).toISOString(),
      createdAt: now.toISOString(),
      comparePassword: async function(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password)
      },
    }

    // Update or push into memoryStore
    const existingIdx = memoryStore.users.findIndex(u => u.email && u.email.toLowerCase() === cleanEmail)
    if (existingIdx !== -1) {
      memoryStore.users[existingIdx] = memUser
    } else {
      memoryStore.users.push(memUser)
    }

    saveDiskStore()

    return mongoUser || memUser
  }

  static async updateProfile(userId, { name, email, dob }) {
    const sId = String(userId)
    const cleanEmail = email.toLowerCase().trim()
    let mongoUpdated = null

    if (getIsMongoConnected()) {
      try {
        mongoUpdated = await MongoUser.findByIdAndUpdate(
          userId,
          { name: name.trim(), email: cleanEmail, dob: new Date(dob) },
          { new: true }
        )
      } catch (err) {
        console.warn('[UserModel] Mongo updateProfile error:', err.message)
      }
    }

    const idx = memoryStore.users.findIndex(u => u.id === sId || String(u._id) === sId)
    if (idx !== -1) {
      memoryStore.users[idx] = {
        ...memoryStore.users[idx],
        name: name.trim(),
        email: cleanEmail,
        dob: new Date(dob).toISOString(),
      }
      saveDiskStore()
    }

    const updatedUser = mongoUpdated || (idx !== -1 ? memoryStore.users[idx] : null)
    return this.attachComparePassword(updatedUser)
  }

  static async updatePassword(userId, newPassword) {
    const sId = String(userId)
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    let mongoUpdated = null

    if (getIsMongoConnected()) {
      try {
        mongoUpdated = await MongoUser.findByIdAndUpdate(
          userId,
          { password: hashedPassword },
          { new: true }
        )
      } catch (err) {
        console.warn('[UserModel] Mongo updatePassword error:', err.message)
      }
    }

    const idx = memoryStore.users.findIndex(u => u.id === sId || String(u._id) === sId)
    if (idx !== -1) {
      memoryStore.users[idx].password = hashedPassword
      saveDiskStore()
    }

    const updatedUser = mongoUpdated || (idx !== -1 ? memoryStore.users[idx] : null)
    return this.attachComparePassword(updatedUser)
  }

  static formatUser(user) {
    if (!user) return null
    return {
      id: user.id || user._id || String(user._id),
      name: user.name,
      email: user.email,
      dob: user.dob,
      createdAt: user.createdAt,
    }
  }
}

module.exports = UserModel
