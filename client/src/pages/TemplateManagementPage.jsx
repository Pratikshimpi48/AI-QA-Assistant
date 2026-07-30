import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import TemplatePreviewModal from '../components/TemplatePreviewModal'
import { getTemplates, createTemplate, deleteTemplate } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function TemplateManagementPage() {
  const { isAuthenticated } = useAuth()
  const [activeType, setActiveType] = useState('test-cases')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState(null)

  // Form State
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'test-cases',
    description: '',
    fieldsText: 'id, title, type, priority, steps, expected, tags',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadTemplates = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getTemplates(activeType)
      setTemplates(res.templates || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report templates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [activeType])

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const fields = formData.fieldsText
        .split(',')
        .map(f => f.trim())
        .filter(Boolean)

      if (fields.length === 0) {
        throw new Error('Please enter at least one template field.')
      }

      await createTemplate({
        name: formData.name,
        type: formData.type,
        description: formData.description,
        structure: {
          fields,
          format: `${formData.name} Custom Template Format`,
        },
      })

      setSuccess(`Template "${formData.name}" created successfully!`)
      setShowModal(false)
      setFormData({ name: '', type: activeType, description: '', fieldsText: 'id, title, type, priority, steps, expected, tags' })
      loadTemplates()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create template.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return
    try {
      await deleteTemplate(id)
      setSuccess(`Template "${name}" deleted.`)
      loadTemplates()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete template.')
    }
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '7.5rem 1.5rem 4rem' }}>
        
        {/* Header Title Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '2rem' }}>📑</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                Report Template Management
              </h1>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
              Upload and manage standardized organizational report templates for Test Cases and Bug Reports.
            </p>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, type: activeType }))
                setShowModal(true)
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.25rem', borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              }}
            >
              <span>➕ Create Custom Template</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
            ✅ {success}
          </div>
        )}

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveType('test-cases')}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', border: '1px solid',
              background: activeType === 'test-cases' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
              borderColor: activeType === 'test-cases' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)',
              color: activeType === 'test-cases' ? '#818cf8' : '#94a3b8',
            }}
          >
            🧪 Test Case Templates
          </button>
          <button
            onClick={() => setActiveType('bug-report')}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', border: '1px solid',
              background: activeType === 'bug-report' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
              borderColor: activeType === 'bug-report' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)',
              color: activeType === 'bug-report' ? '#818cf8' : '#94a3b8',
            }}
          >
            🐛 Bug Report Templates
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No templates found for this type.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column',
                  justify: 'space-between', transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                      background: tmpl.category === 'preset' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)',
                      border: tmpl.category === 'preset' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(34,197,94,0.3)',
                      color: tmpl.category === 'preset' ? '#818cf8' : '#4ade80',
                    }}>
                      {tmpl.category === 'preset' ? 'Official Preset' : 'Custom Organization'}
                    </span>

                    {tmpl.category === 'custom' && (
                      <button
                        onClick={() => handleDelete(tmpl.id, tmpl.name)}
                        style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                          color: '#f87171', padding: '0.25rem 0.6rem', borderRadius: '0.375rem',
                          fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {tmpl.name}
                  </h3>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {tmpl.description}
                  </p>

                  {/* Schema Fields Badge List */}
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                      Required Fields & Layout:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {(tmpl.structure?.fields || []).map((f, i) => (
                        <span key={i} style={{
                          padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#c7d2fe', fontSize: '0.75rem', fontFamily: 'monospace',
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Created by: {tmpl.createdBy}</span>
                  <button
                    onClick={() => setPreviewTemplate(tmpl)}
                    style={{
                      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                      color: '#818cf8', padding: '0.3rem 0.75rem', borderRadius: '0.5rem',
                      fontSize: '0.775rem', fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    }}
                  >
                    👁️ Preview Layout
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Modal for Creating Custom Template */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '1.25rem', padding: '2rem', maxWidth: 520, width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}>
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Create Custom Report Template
            </h2>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ISO 27001 Security Audit Template"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                    color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Report Type *
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(15,23,42,0.9)', border: '1px solid var(--color-border)',
                    color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box',
                  }}
                >
                  <option value="test-cases">🧪 Test Case Template</option>
                  <option value="bug-report">🐛 Bug Report Template</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of when to use this organizational template..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                    color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Required Fields (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="id, title, type, priority, preconditions, steps, expected, tags"
                  value={formData.fieldsText}
                  onChange={e => setFormData({ ...formData, fieldsText: e.target.value })}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                    color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#fff', fontSize: '0.85rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
