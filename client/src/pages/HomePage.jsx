import { useState, useRef, useCallback, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { generateTestCases, getProviders } from '../services/api'

/* ── Shared layout helpers ──────────────────────────────────── */
const container = {
  width: '100%',
  maxWidth: '820px',
  margin: '0 auto',
  padding: '0 1.5rem',
}

/* ── Feature cards data ─────────────────────────────────────── */
const features = [
  {
    id: 'feature-speed',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Instant Generation',
    desc: 'AI processes your requirements in seconds, not hours.',
  },
  {
    id: 'feature-quality',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'High Coverage',
    desc: 'Generates positive, negative, and edge-case scenarios.',
  },
  {
    id: 'feature-export',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: 'Export Ready',
    desc: 'Export to CSV, Excel, or Jira with one click.',
  },
]

/* ── How it works steps ─────────────────────────────────────── */
const steps = [
  { id: 'step-paste',    num: '01', title: 'Paste Requirements',  desc: 'Copy your user stories, BRDs, or any requirements text into the editor.' },
  { id: 'step-generate', num: '02', title: 'Generate with AI',    desc: 'Our AI model analyses context and produces structured test cases instantly.' },
  { id: 'step-export',   num: '03', title: 'Review & Export',     desc: 'Edit, refine, and export your test cases to any project management tool.' },
]

const ACCEPTED_TYPES = '.txt,.pdf,.docx,.md,.csv'

/* ── Read file as text (for .txt / .md / .csv) ──────────────── */
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => resolve(e.target.result)
    reader.onerror = ()  => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

const PRIORITY_COLORS = {
  High:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  Medium: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  Low:    { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)'  },
}
const TYPE_COLORS = {
  Positive:   '#4ade80',
  Negative:   '#f87171',
  'Edge Case':'#fbbf24',
  Security:   '#c084fc',
}

export default function HomePage() {
  const [requirements, setRequirements] = useState('')
  const [file,         setFile]         = useState(null)
  const [isDragging,   setIsDragging]   = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState(null)
  const [result,       setResult]       = useState(null)
  const [provider,     setProvider]     = useState('auto')   // 'auto'|'gemini'|'groq'
  const [providers,    setProviders]    = useState([])        // available providers from backend
  const fileInputRef = useRef(null)

  /* Fetch which providers are configured on the backend */
  useEffect(() => {
    getProviders()
      .then(d => setProviders(d.providers ?? []))
      .catch(() => {}) // silent — backend may not be running yet
  }, [])

  /* ── File processing ──────────────────────────────────────── */
  const processFile = useCallback(async (rawFile) => {
    if (!rawFile) return
    const textTypes = ['text/plain', 'text/markdown', 'text/csv', 'text/x-markdown']
    const isTextLike = textTypes.some(t => rawFile.type.startsWith(t)) ||
      rawFile.name.match(/\.(txt|md|csv)$/i)

    let content = null
    if (isTextLike) {
      try { content = await readAsText(rawFile) } catch { /* ignore */ }
    }
    setFile({ name: rawFile.name, content, rawFile })
    setError(null)
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  const removeFile = (e) => {
    e.stopPropagation()
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── Generate — real AI call ─────────────────────────────── */
  const handleGenerate = async () => {
    if (!requirements.trim() && !file) return
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const payload = {
        requirements: requirements.trim(),
        ...(file     && { fileName: file.name, fileContent: file.content }),
        ...(provider !== 'auto' && { provider }),
      }
      const data = await generateTestCases(payload)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const canGenerate = (requirements.trim().length > 0 || !!file) && !isLoading

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', width: '100%' }}>
      <Navbar />

      {/* Background radial glows */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.10) 0%, transparent 70%)
        `,
      }} />

      <main style={{ position: 'relative', zIndex: 1, width: '100%' }}>

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <section style={{ paddingTop: '8rem', paddingBottom: '3rem', width: '100%' }}>
          <div style={{ ...container, textAlign: 'center' }}>
            {/* Badge */}
            <div id="hero-badge" className="animate-fade-in-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 1rem', borderRadius: '9999px',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.35)',
              color: '#818cf8', fontSize: '0.75rem', fontWeight: 600,
              marginBottom: '2rem',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1', display: 'inline-block' }} />
              Powered by Gemini AI
            </div>

            {/* Headline */}
            <h1 id="hero-headline" className="animate-fade-in-up-delay" style={{
              fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
              fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #818cf8 50%, #06b6d4 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 6s ease infinite, fadeInUp 0.6s ease 0.15s both',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Generate Test Cases<br />from Requirements
            </h1>

            {/* Subtitle */}
            <p id="hero-subtitle" className="animate-fade-in-up-delay-2" style={{
              fontSize: '1.1rem', lineHeight: 1.7,
              color: 'var(--color-text-muted)',
              maxWidth: '520px', margin: '0 auto 2.5rem',
            }}>
              Paste your user stories or upload a document — our AI instantly crafts
              comprehensive, structured test cases so your team ships with confidence.
            </p>
          </div>
        </section>

        {/* ══ FEATURE PILLS ════════════════════════════════════ */}
        <section style={{ paddingBottom: '2.5rem', width: '100%' }}>
          <div style={container}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
              {features.map((f) => (
                <div key={f.id} id={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  flex: '1 1 200px', maxWidth: '240px',
                  transition: 'transform 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <span style={{ color: '#6366f1', flexShrink: 0 }}>{f.icon}</span>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.15rem' }}>{f.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MAIN INPUT CARD ══════════════════════════════════ */}
        <section id="generate" style={{ paddingBottom: '5rem', width: '100%' }}>
          <div style={container}>
            <div style={{
              width: '100%', borderRadius: '1.25rem', overflow: 'hidden',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}>
              {/* Card header */}
              <div style={{
                padding: '1.25rem 2rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '0.5rem',
                  background: 'rgba(99,102,241,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                    Requirements Input
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Paste your user story or upload a requirement document
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Textarea — Story 5 */}
                <div>
                  <label htmlFor="requirements-input" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '0.875rem', fontWeight: 500,
                    color: 'var(--color-text-muted)', marginBottom: '0.5rem',
                  }}>
                    <span>Paste Requirements / User Story</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{requirements.length} chars</span>
                  </label>
                  <textarea
                    id="requirements-input"
                    value={requirements}
                    onChange={(e) => { setRequirements(e.target.value); setError(null) }}
                    rows={9}
                    placeholder={`e.g.\nAs a user, I want to log in with my email and password so that I can access my account.\n\nAcceptance Criteria:\n• Valid credentials → redirect to dashboard\n• Invalid credentials → show error message\n• Forgot password link available`}
                    style={{
                      width: '100%', display: 'block',
                      borderRadius: '0.75rem', resize: 'vertical',
                      fontSize: '0.875rem', lineHeight: 1.65,
                      outline: 'none',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      padding: '1rem',
                      fontFamily: 'Inter, sans-serif',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(99,102,241,0.6)'
                      e.target.style.boxShadow   = '0 0 0 3px rgba(99,102,241,0.1)'
                    }}
                    onBlur={e  => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.target.style.boxShadow   = 'none'
                    }}
                  />
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>

                {/* File Upload — Story 5 */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '0.875rem', fontWeight: 500,
                    color: 'var(--color-text-muted)', marginBottom: '0.5rem',
                  }}>
                    Upload Requirement Document
                  </label>
                  <div
                    id="file-drop-zone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    style={{
                      width: '100%', borderRadius: '0.75rem', padding: '1.5rem',
                      textAlign: 'center', cursor: 'pointer',
                      background: isDragging ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-2)',
                      border: isDragging ? '2px dashed rgba(99,102,241,0.7)' : '2px dashed rgba(255,255,255,0.1)',
                      boxSizing: 'border-box', transition: 'all 0.2s',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      id="file-input"
                      type="file"
                      style={{ display: 'none' }}
                      accept={ACCEPTED_TYPES}
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#818cf8' }}>{file.name}</span>
                        {file.content && (
                          <span style={{ fontSize: '0.7rem', color: '#475569' }}>({file.content.length} chars read)</span>
                        )}
                        <button
                          id="remove-file-btn"
                          onClick={removeFile}
                          style={{
                            fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.375rem',
                            background: 'rgba(239,68,68,0.15)', color: '#f87171',
                            border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg style={{ margin: '0 auto 0.75rem', display: 'block' }} width="28" height="28"
                          viewBox="0 0 24 24" fill="none"
                          stroke={isDragging ? '#6366f1' : '#475569'}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: isDragging ? '#818cf8' : 'var(--color-text-muted)', margin: 0 }}>
                          {isDragging ? 'Drop it here!' : 'Drag & drop or click to upload'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                          Supports .txt, .pdf, .docx, .md, .csv
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Error Banner — Story 6 */}
                {error && (
                  <div id="error-banner" style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.875rem 1rem', borderRadius: '0.75rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p style={{ fontSize: '0.875rem', color: '#f87171', margin: 0, lineHeight: 1.5 }}>{error}</p>
                  </div>
                )}

                {/* ── AI Provider Selector ──────────────────────── */}
                <div>
                  <label htmlFor="provider-select" style={{
                    display: 'block', fontSize: '0.875rem', fontWeight: 500,
                    color: 'var(--color-text-muted)', marginBottom: '0.5rem',
                  }}>
                    AI Model
                  </label>
                  <select
                    id="provider-select"
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.875rem', fontFamily: 'Inter, sans-serif',
                      outline: 'none', cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="auto">⚡ Auto (best available)</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id} disabled={!p.available}>
                        {p.available ? '✅' : '❌'} {p.name}{!p.available ? ' — key not set' : ''}
                      </option>
                    ))}
                  </select>
                  {provider !== 'auto' && providers.find(p => p.id === provider) && (
                    <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.3rem' }}>
                      {providers.find(p => p.id === provider)?.description}
                    </p>
                  )}
                </div>

                {/* ── Generate Button ──────────────────────────── */}
                <button
                  id="generate-btn"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  style={{
                    width: '100%', padding: '1rem', borderRadius: '0.75rem',
                    fontWeight: 700, fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                    border: 'none', outline: 'none',
                    background: canGenerate
                      ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)'
                      : 'rgba(255,255,255,0.06)',
                    color: canGenerate ? '#fff' : '#475569',
                    cursor: canGenerate ? 'pointer' : 'not-allowed',
                    animation: canGenerate ? 'pulse-glow 3s ease-in-out infinite' : 'none',
                    boxShadow: canGenerate ? '0 8px 32px rgba(99,102,241,0.35)' : 'none',
                    transition: 'transform 0.2s, opacity 0.2s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin-slow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                        <path d="M21 12a9 9 0 00-9-9" />
                      </svg>
                      Generating with {provider === 'groq' ? 'Groq / Llama' : provider === 'gemini' ? 'Gemini' : 'AI'}…
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      Generate Test Cases
                    </>
                  )}
                </button>

                <p style={{ fontSize: '0.75rem', textAlign: 'center', color: '#334155' }}>
                  Your data is processed securely and never stored permanently.
                </p>
              </div>
            </div>

            {/* ── Test Case Results ─────────────────────────── */}
            {result && result.testCases && result.testCases.length > 0 && (
              <div id="result-section" style={{ marginTop: '2rem' }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {result.testCases.length} Test Cases Generated
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '9999px',
                      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                      color: '#818cf8', fontWeight: 600,
                    }}>
                      {result.meta?.provider ?? 'AI'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                      {result.meta?.model}
                    </span>
                  </div>
                </div>

                {/* Test Case Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {result.testCases.map((tc, i) => {
                    const pColor = PRIORITY_COLORS[tc.priority] ?? PRIORITY_COLORS.Medium
                    const tColor = TYPE_COLORS[tc.type] ?? '#94a3b8'
                    return (
                      <div
                        key={tc.id ?? i}
                        id={`tc-${tc.id ?? i}`}
                        style={{
                          borderRadius: '0.875rem', padding: '1.25rem',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          transition: 'transform 0.15s, border-color 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform     = 'translateX(4px)'
                          e.currentTarget.style.borderColor   = 'rgba(99,102,241,0.35)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform     = 'translateX(0)'
                          e.currentTarget.style.borderColor   = 'rgba(255,255,255,0.08)'
                        }}
                      >
                        {/* Card header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{tc.id}</span>
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.06)', color: tColor, border: `1px solid ${tColor}40`, fontWeight: 600 }}>
                              {tc.type}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '9999px',
                            background: pColor.bg, color: pColor.color,
                            border: `1px solid ${pColor.border}`, fontWeight: 700, flexShrink: 0,
                          }}>
                            {tc.priority}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}>
                          {tc.title}
                        </h4>

                        {/* Steps */}
                        {tc.steps?.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Steps</p>
                            <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                              {tc.steps.map((step, si) => (
                                <li key={si} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', lineHeight: 1.5 }}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Expected result */}
                        {tc.expected && (
                          <div style={{
                            padding: '0.6rem 0.875rem', borderRadius: '0.5rem',
                            background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                          }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expected Result</p>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{tc.expected}</p>
                          </div>
                        )}

                        {/* Tags */}
                        {tc.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {tc.tags.map((tag, ti) => (
                              <span key={ti} style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Meta footer */}
                <p style={{ fontSize: '0.7rem', color: '#334155', textAlign: 'center', marginTop: '1rem' }}>
                  Generated {result.meta?.generatedAt ? new Date(result.meta.generatedAt).toLocaleTimeString() : ''}
                  {result.meta?.fallback ? ' · Used fallback provider' : ''}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
        <section id="how-it-works" style={{ paddingBottom: '6rem', width: '100%' }}>
          <div style={container}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700,
              textAlign: 'center', marginBottom: '3rem',
              color: 'var(--color-text)',
            }}>
              How it works
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
            }}>
              {steps.map((s) => (
                <div
                  key={s.id}
                  id={s.id}
                  style={{
                    borderRadius: '1rem', padding: '1.5rem',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <span style={{
                    fontSize: '2.5rem', fontWeight: 900, display: 'block', marginBottom: '1rem',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.55) 0%, rgba(6,182,212,0.55) 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{s.num}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center', padding: '2rem 1.5rem',
          fontSize: '0.75rem', color: '#334155',
          borderTop: '1px solid var(--color-border)',
        }}>
          © {new Date().getFullYear()} AI QA Assistant. Built for QA Engineers who move fast.
        </footer>
      </main>
    </div>
  )
}
