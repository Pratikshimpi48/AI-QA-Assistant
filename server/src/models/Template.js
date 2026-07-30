'use strict'

const mongoose = require('mongoose')
const { getIsMongoConnected, memoryStore, saveDiskStore } = require('../config/db')

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['test-cases', 'bug-report'],
    required: true,
  },
  category: {
    type: String,
    enum: ['preset', 'custom'],
    default: 'custom',
  },
  description: {
    type: String,
    default: '',
  },
  structure: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  samplePreview: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdBy: {
    type: String,
    default: 'System',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const MongoTemplate = mongoose.model('Template', templateSchema)

// Rich Industry Standard Free Preset Templates
const PRESET_TEMPLATES = [
  {
    id: 'tmpl_spreadsheet_matrix',
    name: 'Pratik Shimpi Template',
    type: 'test-cases',
    category: 'preset',
    description: 'Custom Enterprise QA spreadsheet grid layout featuring Section Headers, Pre-conditions, Step Descriptions, Expected vs Actual Results, Test Data, Status dropdowns, Bug IDs, and QA Comments.',
    isDefault: true,
    createdBy: 'Pratik Shimpi (Admin)',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['testCaseId', 'scenario', 'stepDescription', 'expectedResult', 'actualResult', 'testData', 'status', 'bugId', 'qaComments'],
      format: 'Enterprise QA Spreadsheet Grid',
    },
    samplePreview: [
      {
        testCaseId: 'TC_BAP_001',
        scenario: 'Verify the contents of the Sign In section',
        stepDescription: '1. Check the main heading text.\n2. Check the active and adjacent top tab text.\n3. Check the placeholders for input fields.\n4. Check the text on the buttons.\n5. Check the password recovery link text.',
        expectedResult: '1. Headings & Tabs: Main heading "SIGN IN FOR A FASTER CHECKOUT".\n2. Input Placeholders: "Email address" and "Password".\n3. Buttons: Blue button "SIGN IN", Purple button "CHECKOUT AS A GUEST".\n4. Link Text: "Forgot your password?".',
        actualResult: 'User is able to see all expected headings, placeholders, buttons, and recovery link matching design spec.',
        testData: 'N/A',
        status: 'Passed',
        bugId: '',
        qaComments: 'Verified on Chrome 124 staging build.',
      },
      {
        testCaseId: 'TC_BAP_002',
        scenario: 'Verify the user is able to log in when entering valid credentials',
        stepDescription: '1. Enter valid email address and password.\n2. Click on the blue "SIGN IN" button.',
        expectedResult: 'On successful login, User should be logged in and redirected to the home page or dashboard.',
        actualResult: 'On successful login, User is logged in and redirected to dashboard.',
        testData: 'Email: test.user@example.com\nPassword: Testuser@1234',
        status: 'Passed',
        bugId: '',
        qaComments: '',
      },
    ],
  },
  {
    id: 'tmpl_std_tc',
    name: 'Standard Enterprise QA Suite',
    type: 'test-cases',
    category: 'preset',
    description: 'Comprehensive QA test cases with ID, Title, Category, Priority, Step-by-Step execution, and Expected Results.',
    isDefault: false,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['id', 'title', 'type', 'priority', 'steps', 'expected', 'tags'],
      format: 'Standard JSON array of test cases',
    },
    samplePreview: [
      {
        id: 'TC-001',
        title: 'User login with valid registered email and password',
        type: 'Positive',
        priority: 'High',
        steps: ['Navigate to /login', 'Enter user@example.com into Email field', 'Enter valid password', 'Click "Log In" button'],
        expected: 'User is authenticated and redirected to Dashboard page with active session token.',
        tags: ['auth', 'login', 'smoke'],
      },
    ],
  },
  {
    id: 'tmpl_ieee829_tc',
    name: 'IEEE 829 Standard Test Case Specification',
    type: 'test-cases',
    category: 'preset',
    description: 'Formal IEEE 829 software test documentation format detailing test items, environmental needs, input data, and dependencies.',
    isDefault: false,
    createdBy: 'IEEE / ISO Standard',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['testCaseId', 'testItem', 'summary', 'environmentalNeeds', 'inputData', 'executionSteps', 'expectedOutputs', 'intercaseDependencies'],
      format: 'IEEE 829 Standard Test Specification',
    },
    samplePreview: [
      {
        testCaseId: 'IEEE-TC-104',
        testItem: 'JWT Authentication Module v2.1',
        summary: 'Verify token expiration and auto-logout mechanism',
        environmentalNeeds: 'Staging Environment, Chrome 124, Isolated Auth Microservice',
        inputData: 'Expired JWT Token bearer string',
        executionSteps: ['Attach expired token to Authorization header', 'Send GET request to /api/user/profile'],
        expectedOutputs: 'HTTP status 401 Unauthorized returned with error payload {"message": "Token expired"}.',
        intercaseDependencies: 'Requires completed user registration IEEE-TC-101',
      },
    ],
  },
  {
    id: 'tmpl_owasp_tc',
    name: 'OWASP Security & Penetration Audit Suite',
    type: 'test-cases',
    category: 'preset',
    description: 'Security testing template aligned with OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, Broken Access Control).',
    isDefault: false,
    createdBy: 'OWASP Foundation',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['vulnerabilityId', 'owaspCategory', 'severity', 'attackVector', 'preconditions', 'stepsToTrigger', 'remediationCriteria'],
      format: 'OWASP Security Audit Test Format',
    },
    samplePreview: [
      {
        vulnerabilityId: 'SEC-OWASP-01',
        owaspCategory: 'A03:2021-Injection (XSS)',
        severity: 'Critical',
        attackVector: 'Reflected Cross-Site Scripting via search input payload',
        preconditions: 'Unauthenticated access to public search endpoint',
        stepsToTrigger: ['Paste `<script>alert(document.cookie)</script>` into search bar', 'Submit form'],
        remediationCriteria: 'Search input must sanitize HTML entities and return sanitized output without executing scripts.',
      },
    ],
  },
  {
    id: 'tmpl_bdd_tc',
    name: 'Agile BDD (Given-When-Then)',
    type: 'test-cases',
    category: 'preset',
    description: 'Behavior-Driven Development (BDD) scenario layout using Given-When-Then acceptance criteria format.',
    isDefault: false,
    createdBy: 'Agile Alliance',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['id', 'scenarioTitle', 'priority', 'given', 'when', 'then', 'tags'],
      format: 'BDD Scenario format',
    },
    samplePreview: [
      {
        id: 'BDD-SC-05',
        scenarioTitle: 'Password reset link generation for forgotten passwords',
        priority: 'High',
        given: 'Given an existing user on the Forgot Password page',
        when: 'When they enter their valid registered email and click "Reset Password"',
        then: 'Then a secure password reset token link is dispatched to their email inbox within 30 seconds.',
        tags: ['bdd', 'auth', 'user-story-42'],
      },
    ],
  },
  {
    id: 'tmpl_std_bug',
    name: 'Standard Jira & GitHub Bug Report',
    type: 'bug-report',
    category: 'preset',
    description: 'Industry-standard structured bug ticket with title, severity, environment, steps to reproduce, expected vs actual behavior, and workaround.',
    isDefault: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['title', 'severity', 'type', 'environment', 'summary', 'stepsToReproduce', 'expectedBehavior', 'actualBehavior', 'workaround', 'tags'],
      format: 'Standard Bug Report JSON object',
    },
    samplePreview: {
      title: 'Checkout button remains disabled after entering valid payment information',
      severity: 'High',
      type: 'Bug',
      environment: 'Production / Chrome 124 / macOS Sonoma',
      summary: 'Users cannot complete purchase because the final "Place Order" button does not enable after filling out valid credit card details.',
      stepsToReproduce: [
        'Add items to cart and proceed to Checkout page',
        'Enter valid shipping address and select Express Shipping',
        'Input valid test credit card number and CVV',
      ],
      expectedBehavior: 'Place Order button turns active and clickable.',
      actualBehavior: 'Button remains disabled with opacity 0.5 and cursor not-allowed.',
      workaround: 'Refreshing the page enables the button.',
      tags: ['checkout', 'payment', 'frontend'],
    },
  },
  {
    id: 'tmpl_mozilla_bug',
    name: 'Mozilla Bugzilla Defect & Crash Report',
    type: 'bug-report',
    category: 'preset',
    description: 'Detailed open-source defect format modeled after Mozilla Bugzilla, including Component, Hardware, Stack Trace, and Build ID.',
    isDefault: false,
    createdBy: 'Mozilla Bugzilla Standard',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['title', 'component', 'severity', 'hardwareConfig', 'buildId', 'summary', 'stepsToReproduce', 'stackTraceLog', 'expectedBehavior', 'actualBehavior'],
      format: 'Mozilla Defect Report Object',
    },
    samplePreview: {
      title: 'Uncaught TypeError: Cannot read property "amount" of undefined during checkout API call',
      component: 'API Server / Payment Gateway',
      severity: 'Critical',
      hardwareConfig: 'Node v20.11 / Linux x86_64',
      buildId: 'v2.4.12-build-894',
      summary: 'Server crashes with 500 status code when payment amount payload is processed without currency code.',
      stepsToReproduce: [
        'Send POST request to /api/checkout with payload missing currency field',
        'Inspect server console output logs',
      ],
      stackTraceLog: 'TypeError: Cannot read property "amount" of undefined\n  at processPayment (payment.js:42:18)\n  at Layer.handle [as handle_request] (express/router/layer.js:95)',
      expectedBehavior: 'API returns HTTP status 400 Bad Request with validation payload error message.',
      actualBehavior: 'Unhandled 500 exception crashes process loop.',
    },
  },
  {
    id: 'tmpl_exec_bug',
    name: 'Executive & Stakeholder Incident Report',
    type: 'bug-report',
    category: 'preset',
    description: 'High-level bug report focused on business impact, root cause, severity, affected user scope, and recommended fix.',
    isDefault: false,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['title', 'severity', 'type', 'businessImpact', 'affectedScope', 'summary', 'stepsToReproduce', 'expectedBehavior', 'actualBehavior', 'recommendedFix', 'tags'],
      format: 'Executive Incident Report JSON object',
    },
    samplePreview: {
      title: 'Intermittent 502 Bad Gateway response on user authentication service',
      severity: 'Critical',
      type: 'Incident',
      businessImpact: 'Est. $12,000 lost revenue per hour due to customer login blockages.',
      affectedScope: '~18% of active mobile application users during peak traffic hours',
      summary: 'Auth microservice pod memory leak causes proxy timeout on ingress gateway.',
      stepsToReproduce: [
        'Simulate 1,500 concurrent authentication requests',
        'Monitor proxy response times',
      ],
      expectedBehavior: 'Response times remain below 200ms without HTTP 502 errors.',
      actualBehavior: 'Gateway times out after 10s and returns 502 Bad Gateway.',
      recommendedFix: 'Increase pod memory limits to 2GB and restart connection pool workers.',
      tags: ['executive', 'incident', 'auth'],
    },
  },
]

class TemplateModel {
  static initPresets() {
    if (!memoryStore.templates) {
      memoryStore.templates = []
    }
    // Update or insert presets in memoryStore
    PRESET_TEMPLATES.forEach(preset => {
      const idx = memoryStore.templates.findIndex(t => t.id === preset.id || t.name === preset.name)
      if (idx !== -1) {
        memoryStore.templates[idx] = { ...memoryStore.templates[idx], ...preset }
      } else {
        memoryStore.templates.push(preset)
      }
    })
    saveDiskStore()
  }

  static async findByType(type = null) {
    this.initPresets()
    let items = []

    if (getIsMongoConnected()) {
      try {
        const query = type ? { type } : {}
        items = await MongoTemplate.find(query).sort({ category: 1, name: 1 })
      } catch (err) {
        console.warn('[TemplateModel] Mongo findByType error:', err.message)
      }
    }

    const memItems = (memoryStore.templates || []).filter(t => !type || t.type === type)
    const combined = [...items]

    memItems.forEach(m => {
      const idx = combined.findIndex(c => String(c._id || c.id) === String(m.id || m._id))
      if (idx === -1) combined.push(m)
    })

    return combined.map(t => this.formatTemplate(t))
  }

  static async findById(id) {
    this.initPresets()
    if (!id) return null

    let tmpl = null
    if (getIsMongoConnected()) {
      try {
        tmpl = await MongoTemplate.findById(id)
      } catch (_e) { /* ignore */ }
    }

    if (!tmpl) {
      tmpl = (memoryStore.templates || []).find(t => String(t.id || t._id) === String(id))
    }

    return this.formatTemplate(tmpl)
  }

  static async create({ name, type, description, structure, samplePreview, createdBy }) {
    this.initPresets()
    const id = 'tmpl_cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)

    const newTemplate = {
      id,
      _id: id,
      name: name.trim(),
      type,
      category: 'custom',
      description: description || '',
      structure: typeof structure === 'string' ? JSON.parse(structure) : structure,
      samplePreview: samplePreview || null,
      createdBy: createdBy || 'User',
      isDefault: false,
      createdAt: new Date().toISOString(),
    }

    if (getIsMongoConnected()) {
      try {
        const m = new MongoTemplate(newTemplate)
        await m.save()
      } catch (err) {
        console.warn('[TemplateModel] Mongo create error:', err.message)
      }
    }

    if (!memoryStore.templates) memoryStore.templates = []
    memoryStore.templates.push(newTemplate)
    saveDiskStore()

    return this.formatTemplate(newTemplate)
  }

  static async delete(id) {
    this.initPresets()
    const sId = String(id)
    const preset = PRESET_TEMPLATES.find(p => p.id === sId)
    if (preset) {
      throw new Error('Preset templates cannot be deleted.')
    }

    if (getIsMongoConnected()) {
      try {
        await MongoTemplate.findByIdAndDelete(id)
      } catch (_e) { /* ignore */ }
    }

    const idx = (memoryStore.templates || []).findIndex(t => String(t.id || t._id) === sId)
    if (idx !== -1) {
      memoryStore.templates.splice(idx, 1)
      saveDiskStore()
    }
    return true
  }

  static formatTemplate(t) {
    if (!t) return null
    return {
      id: t.id || t._id || String(t._id),
      name: t.name,
      type: t.type,
      category: t.category || 'custom',
      description: t.description || '',
      structure: t.structure,
      samplePreview: t.samplePreview || null,
      createdBy: t.createdBy || 'System',
      isDefault: Boolean(t.isDefault),
      createdAt: t.createdAt,
    }
  }
}

// Initialize presets on module import
TemplateModel.initPresets()

module.exports = { TemplateModel, PRESET_TEMPLATES }
