'use strict'

const express         = require('express')
const router          = express.Router()
const { optionalAuth, authenticateToken } = require('../middleware/auth')
const HistoryModel    = require('../models/History')
const { buildBugReportPrompt, parseBugReportResponse } = require('../services/promptBuilder')
const { TemplateModel } = require('../models/Template')
const { detectDuplicates } = require('../services/duplicateDetection')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const Groq = require('groq-sdk')

/**
 * POST /api/bug-report/generate
 * Optional auth (attaches history if user logged in)
 */
router.post('/generate', optionalAuth, async (req, res, next) => {
  try {
    const { issueDescription, templateId } = req.body

    if (!issueDescription || !issueDescription.trim()) {
      return res.status(400).json({
        status:  'error',
        message: 'Issue description is required to generate a bug report.',
      })
    }

    let template = null
    if (templateId) {
      try {
        template = await TemplateModel.findById(templateId)
      } catch (_e) { /* ignore */ }
    }

    const { systemPrompt, userMessage } = buildBugReportPrompt(issueDescription, template)
    let bugReport = null
    let providerName = 'gemini'

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = ai.getGenerativeModel({
          model: 'gemini-flash-latest',
          systemInstruction: systemPrompt,
        })
        const resp = await model.generateContent(userMessage)
        const text = resp.response.text()
        bugReport = parseBugReportResponse(text)
        providerName = 'gemini'
      } catch (geminiErr) {
        if (process.env.GROQ_API_KEY) {
          console.warn('[BugReport] Gemini failed, falling back to Groq:', geminiErr.message)
          providerName = 'groq'
          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
          const chat = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
          })
          const text = chat.choices[0]?.message?.content || ''
          bugReport = parseBugReportResponse(text)
        } else {
          throw geminiErr
        }
      }
    } else if (process.env.GROQ_API_KEY) {
      providerName = 'groq'
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const chat = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
      })
      const text = chat.choices[0]?.message?.content || ''
      bugReport = parseBugReportResponse(text)
    } else {
      return res.status(503).json({
        status:  'error',
        message: 'No AI API keys configured on backend.',
      })
    }

    // Save to user history if logged in
    let historyRecord = null
    if (req.user) {
      historyRecord = await HistoryModel.create({
        userId: req.user.id,
        type:   'bug-report',
        title:  bugReport.title || 'Generated Bug Report',
        data:   bugReport,
        meta:   { provider: providerName, generatedAt: new Date().toISOString() },
      })
    }

    return res.json({
      status:    'ok',
      bugReport,
      meta: {
        provider:    providerName,
        generatedAt: new Date().toISOString(),
        saved:       !!historyRecord,
      },
    })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/bug-report/check-duplicates
 * Auth required — compares new bug details against user's existing bug history using AI
 */
router.post('/check-duplicates', authenticateToken, async (req, res, next) => {
  try {
    const { title, description, stepsToReproduce, expectedBehavior, actualBehavior } = req.body

    if (!title && !description) {
      return res.status(400).json({
        status:  'error',
        message: 'At least a title or description is required to check for duplicates.',
      })
    }

    // Fetch user's existing bug reports from history
    const allHistory   = await HistoryModel.findByUserId(req.user.id)
    const existingBugs = allHistory.filter(h => h.type === 'bug-report')

    if (existingBugs.length === 0) {
      return res.json({ status: 'ok', duplicates: [], message: 'No existing bug reports to compare against.' })
    }

    const newBug     = { title, description, stepsToReproduce, expectedBehavior, actualBehavior }
    const duplicates = await detectDuplicates(newBug, existingBugs)

    return res.json({
      status:       'ok',
      duplicates,
      totalChecked: existingBugs.length,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
