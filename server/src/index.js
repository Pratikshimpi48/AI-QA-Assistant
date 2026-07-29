'use strict'

const env     = require('./config/env')
const express = require('express')
const cors    = require('cors')

const healthRouter   = require('./routes/health')
const generateRouter = require('./routes/generate')

const app = express()

/* ── Middleware ─────────────────────────────────────── */
app.use(cors({
  origin:      env.CLIENT_URL,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

/* ── Routes ─────────────────────────────────────────── */
app.use('/api/health',   healthRouter)
app.use('/api/generate', generateRouter)

/* ── 404 handler ────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` })
})

/* ── Global error handler ───────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('[Error]', err)
  res.status(err.status || 500).json({
    status:  'error',
    message: err.message || 'Internal Server Error',
  })
})

/* ── Start server ───────────────────────────────────── */
const PORT = Number(env.PORT)
app.listen(PORT, () => {
  console.log(`\n🚀 AI QA Assistant API`)
  console.log(`   ➜  http://localhost:${PORT}/api/health`)
  console.log(`   ➜  Environment: ${env.NODE_ENV}\n`)
})
