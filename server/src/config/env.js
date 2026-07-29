'use strict'

require('dotenv').config()

const env = {
  PORT:       process.env.PORT       || '5000',
  NODE_ENV:   process.env.NODE_ENV   || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
}

module.exports = env
