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

// Preset default templates
const PRESET_TEMPLATES = [
  {
    id: 'tmpl_std_tc',
    name: 'Standard Enterprise QA Suite',
    type: 'test-cases',
    category: 'preset',
    description: 'Comprehensive QA test cases with ID, Title, Category, Priority, Step-by-Step execution, and Expected Results.',
    isDefault: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['id', 'title', 'type', 'priority', 'steps', 'expected', 'tags'],
      format: 'Standard JSON array of test cases',
    },
  },
  {
    id: 'tmpl_iso_tc',
    name: 'ISO/IEC 29119 Formal Specification',
    type: 'test-cases',
    category: 'preset',
    description: 'ISO/IEEE compliant test specification layout with environmental needs, pre-conditions, input data, and pass/fail criteria.',
    isDefault: false,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['id', 'title', 'type', 'priority', 'preconditions', 'steps', 'expected', 'passCriteria', 'tags'],
      format: 'ISO/IEC 29119 formal testing standard',
    },
  },
  {
    id: 'tmpl_bdd_tc',
    name: 'Agile BDD (Given-When-Then)',
    type: 'test-cases',
    category: 'preset',
    description: 'Behavior-Driven Development (BDD) scenario layout using Given-When-Then acceptance criteria format.',
    isDefault: false,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    structure: {
      fields: ['id', 'title', 'type', 'priority', 'given', 'when', 'then', 'tags'],
      format: 'BDD Scenario format',
    },
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
  },
]

class TemplateModel {
  static initPresets() {
    if (!memoryStore.templates) {
      memoryStore.templates = []
    }
    // Ensure all presets exist in memoryStore
    PRESET_TEMPLATES.forEach(preset => {
      const exists = memoryStore.templates.some(t => t.id === preset.id || t.name === preset.name)
      if (!exists) {
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

    // Merge memoryStore custom templates & presets
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

  static async create({ name, type, description, structure, createdBy }) {
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
      createdBy: t.createdBy || 'System',
      isDefault: Boolean(t.isDefault),
      createdAt: t.createdAt,
    }
  }
}

// Initialize presets on module import
TemplateModel.initPresets()

module.exports = { TemplateModel, PRESET_TEMPLATES }
