'use strict'

const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const { getIsMongoConnected, memoryStore } = require('../config/db')

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

// Password comparison helper
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const MongoUser = mongoose.model('User', userSchema)

class UserModel {
  static async findByEmail(email) {
    const cleanEmail = email.toLowerCase().trim()
    if (getIsMongoConnected()) {
      return await MongoUser.findOne({ email: cleanEmail })
    } else {
      return memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail) || null
    }
  }

  static async findById(id) {
    if (getIsMongoConnected()) {
      return await MongoUser.findById(id)
    } else {
      return memoryStore.users.find(u => u.id === id || u._id === id) || null
    }
  }

  static async create({ name, email, password, dob }) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const cleanEmail = email.toLowerCase().trim()

    if (getIsMongoConnected()) {
      const newUser = new MongoUser({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        dob: new Date(dob),
      })
      await newUser.save()
      return newUser
    } else {
      const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
      const newUser = {
        id,
        _id: id,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        dob: new Date(dob).toISOString(),
        createdAt: new Date().toISOString(),
        comparePassword: async function(cand) {
          return await bcrypt.compare(cand, this.password)
        },
      }
      memoryStore.users.push(newUser)
      return newUser
    }
  }

  static formatUser(user) {
    return {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      dob: user.dob,
      createdAt: user.createdAt,
    }
  }
}

module.exports = UserModel
