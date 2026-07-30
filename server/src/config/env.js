'use strict'

require('dotenv').config()

const env = {
  PORT:       process.env.PORT       || '5000',
  NODE_ENV:   process.env.NODE_ENV   || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_ai_qa_assistant_2026',
  MONGO_URI:  process.env.MONGO_URI  || 'mongodb://127.0.0.1:27017/ai-qa-assistant',
}

module.exports = env
