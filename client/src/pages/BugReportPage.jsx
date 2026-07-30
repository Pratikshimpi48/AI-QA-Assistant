import { useState } from 'react'
import { generateBugReport } from '../services/api'
import Navbar from '../components/Navbar'
import ExportButton from '../components/ExportButton'
import { exportBugReport } from '../utils/exportUtils'
import { useAuth } from '../context/AuthContext'
import { addGuestHistoryItem } from '../utils/guestSession'

const S = {
  page:    { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:    { maxWidth: 900, margin: '0 auto', padding: '7.5rem 1.5rem 4rem' },
  badge:   {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.375rem 1rem', borderRadius: '9999px',
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
  },
  heading: { fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' },
  sub:     { fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '2rem' },
  card:    {
    borderRadius: '1rem', padding: '2rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  },
}

export default function BugReportPage() {
  const [issueDescription, setIssueDescription] = useState('')
  const [bugReport, setBugReport]               = useState(null)
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState('')
  const [copied, setCopied]                     = useState(false)

  const { isAuthenticated } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!issueDescription.trim()) return

    setError('')
    setBugReport(null)
    setLoading(true)

    try {
      const res = await generateBugReport({ issueDescription: issueDescription.trim() })
      setBugReport(res.bugReport)

      if (!isAuthenticated && res.bugReport) {
        addGuestHistoryItem({
          type:  'bug-report',
          title: res.bugReport.title || 'Generated Bug Report',
          data:  res.bugReport,
          meta:  res.meta,
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to generate bug report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!bugReport) return
    const formattedText = `
[BUG REPORT] ${bugReport.title}
Severity: ${bugReport.severity || 'Medium'}
Environment: ${bugReport.environment || 'Production'}

SUMMARY:
${bugReport.summary}

STEPS TO REPRODUCE:
${Array.isArray(bugReport.stepsToReproduce) ? bugReport.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n') : bugReport.stepsToReproduce}

EXPECTED BEHAVIOR:
${bugReport.expectedBehavior}

ACTUAL BEHAVIOR:
${bugReport.actualBehavior}

WORKAROUND:
${bugReport.workaround || 'None'}
    `.trim()

    navigator.clipboard.writeText(formattedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>🐛 Bug Report Generator</div>
        <h1 style={S.heading}>AI Bug Report Generator</h1>
        <p style={S.sub}>
          Describe the issue you encountered, paste error logs, or user feedback. AI will convert it into a structured, Jira-ready bug report and save it to your history.
        </p>

        {/* Input Form */}
        <div style={S.card}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Describe the Bug / Paste Logs
            </label>
            <textarea
              id="bug-description-input"
              rows={6}
              placeholder="e.g. User logs in with valid credentials but gets redirected to 404 page instead of dashboard. Console log shows POST /api/login returned 200 but token was not saved."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              required
              style={{
                width: '100%', padding: '1rem', borderRadius: '0.75rem',
                background: 'rgba(0,0,0,0.25)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box', lineHeight: 1.6, resize: 'vertical',
              }}
            />

            {error && (
              <div style={{
                marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', fontSize: '0.85rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              id="generate-bug-report-btn"
              type="submit"
              disabled={loading || !issueDescription.trim()}
              style={{
                marginTop: '1.25rem', padding: '0.85rem 1.75rem', borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff', fontSize: '0.95rem', fontWeight: 700,
                border: 'none', cursor: (loading || !issueDescription.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
                opacity: (loading || !issueDescription.trim()) ? 0.6 : 1, transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <svg className="spin-slow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Generating Report...
                </>
              ) : (
                '🚀 Generate Bug Report'
              )}
            </button>
          </form>
        </div>

        {/* Output Bug Report View */}
        {bugReport && (
          <div style={{ ...S.card, marginTop: '2rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: '9999px',
                  background: 'rgba(239,68,68,0.2)', color: '#f87171',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                }}>
                  {bugReport.severity || 'Medium'} Severity
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: '0.5rem 0 0' }}>
                  {bugReport.title}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '0.55rem 1.15rem', borderRadius: '0.625rem',
                    background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                    border: copied ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--color-border)',
                    color: copied ? '#4ade80' : 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {copied ? '✓ Copied to Clipboard!' : '📋 Copy Bug Report'}
                </button>
                <ExportButton
                  label="Export Bug Report"
                  onExport={(format) => exportBugReport(bugReport, format, 'Generated_Bug_Report')}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--color-text)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: '#94a3b8', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Summary
                </strong>
                <p style={{ margin: '0.25rem 0 0' }}>{bugReport.summary}</p>
              </div>

              {Array.isArray(bugReport.stepsToReproduce) && (
                <div>
                  <strong style={{ color: '#94a3b8', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Steps to Reproduce
                  </strong>
                  <ol style={{ margin: '0.35rem 0 0 1.25rem', padding: 0 }}>
                    {bugReport.stepsToReproduce.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong style={{ color: '#4ade80', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Expected Behavior
                  </strong>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem' }}>{bugReport.expectedBehavior}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <strong style={{ color: '#f87171', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    Actual Behavior
                  </strong>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem' }}>{bugReport.actualBehavior}</p>
                </div>
              </div>

              {bugReport.workaround && (
                <div>
                  <strong style={{ color: '#94a3b8', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Workaround
                  </strong>
                  <p style={{ margin: '0.25rem 0 0' }}>{bugReport.workaround}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
