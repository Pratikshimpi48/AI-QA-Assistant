import { useState } from 'react'

export default function TemplatePreviewModal({ template, onClose }) {
  const [copied, setCopied] = useState(false)
  if (!template) return null

  const sampleData = template.samplePreview || (
    template.type === 'test-cases'
      ? [
          {
            id: 'TC-001',
            title: 'Sample Test Case Title',
            type: 'Positive',
            priority: 'High',
            steps: ['Step 1: Perform action', 'Step 2: Enter valid data'],
            expected: 'System responds with 200 OK and expected state.',
            tags: ['sample', 'template'],
          },
        ]
      : {
          title: 'Sample Bug Report Title',
          severity: 'High',
          type: 'Bug',
          environment: 'Production / Chrome 124',
          summary: 'Summary description of the defect.',
          stepsToReproduce: ['1. Navigate to page', '2. Click button'],
          expectedBehavior: 'Feature executes smoothly.',
          actualBehavior: 'Error occurs.',
          workaround: 'None',
          tags: ['sample'],
        }
  )

  const formattedJson = JSON.stringify(sampleData, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem',
    }}>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '1.25rem', padding: '2rem', maxWidth: 720, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.4rem' }}>👁️</span>
              <span style={{
                padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                background: template.category === 'preset' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)',
                border: template.category === 'preset' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(34,197,94,0.3)',
                color: template.category === 'preset' ? '#818cf8' : '#4ade80',
              }}>
                {template.category === 'preset' ? `Official Preset — ${template.createdBy}` : 'Custom Organization Template'}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {template.name}
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {template.description}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              fontSize: '1.1rem', fontWeight: 700, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Required Fields Schema */}
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', display: 'block', marginBottom: '0.5rem' }}>
            📋 Required Field Structure:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {(template.structure?.fields || []).map((field, idx) => (
              <span key={idx} style={{
                padding: '0.2rem 0.65rem', borderRadius: '0.375rem',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                color: '#c7d2fe', fontSize: '0.775rem', fontFamily: 'monospace', fontWeight: 600,
              }}>
                {field}
              </span>
            ))}
          </div>
        </div>

        {/* Live Output Preview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
              ✨ Live Generated Content Format Preview:
            </span>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '0.375rem',
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {copied ? '✅ Copied!' : '📋 Copy Sample JSON'}
            </button>
          </div>

          <pre style={{
            background: '#090d16', border: '1px solid var(--color-border)',
            borderRadius: '0.75rem', padding: '1.25rem', color: '#38bdf8',
            fontSize: '0.825rem', fontFamily: 'Fira Code, monospace', lineHeight: 1.55,
            overflowX: 'auto', maxHeight: 320, margin: 0,
          }}>
            {formattedJson}
          </pre>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
