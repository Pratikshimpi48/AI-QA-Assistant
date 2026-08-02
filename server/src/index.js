'use strict'

const path      = require('path')
const fs        = require('fs')
const env       = require('./config/env')
const express   = require('express')
const cors      = require('cors')
const { connectDB } = require('./config/db')

const healthRouter        = require('./routes/health')
const generateRouter      = require('./routes/generate')
const authRouter          = require('./routes/auth')
const historyRouter       = require('./routes/history')
const bugReportRouter     = require('./routes/bugReport')
const jiraRouter          = require('./routes/jira')
const notificationsRouter = require('./routes/notifications')
const templatesRouter     = require('./routes/templates')
const adminRouter         = require('./routes/admin')
const jiraPoller          = require('./services/jiraPoller')

const app = express()

/* ── Middleware ─────────────────────────────────────── */
app.use(cors({
  origin:      env.CLIENT_URL || true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

/* ── API Routes ─────────────────────────────────────── */
app.use('/api/health',         healthRouter)
app.use('/api/generate',       generateRouter)
app.use('/api/auth',           authRouter)
app.use('/api/history',        historyRouter)
app.use('/api/bug-report',     bugReportRouter)
app.use('/api/jira',           jiraRouter)
app.use('/api/notifications',  notificationsRouter)
app.use('/api/templates',      templatesRouter)
app.use('/api/admin',          adminRouter)

/* ── Serve Static React Client in Production ────────── */
const clientDistPath = path.join(__dirname, '../../client/dist')
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
} else {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` })
  })
}

/* ── Global error handler ───────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('[Error]', err)
  res.status(err.status || 500).json({
    status:  'error',
    message: err.message || 'Internal Server Error',
  })
})

/* ── Start server ───────────────────────────────────── */
const PORT = Number(env.PORT) || 5000

async function startServer() {
  await connectDB()
  jiraPoller.startPolling()
  app.listen(PORT, () => {
    console.log(`\n🚀 AI QA Assistant Running on Port ${PORT}`)
    console.log(`   ➜  Health check: http://localhost:${PORT}/api/health\n`)
  })
}

startServer()
