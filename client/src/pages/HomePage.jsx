import { useState, useRef } from 'react'
import Navbar from '../components/Navbar'

/* ── Shared layout helpers ──────────────────────────────────── */
const container = {
  width: '100%',
  maxWidth: '780px',
  margin: '0 auto',
  padding: '0 1.5rem',
}

/* ── Feature cards data ─────────────────────────────────────── */
const features = [
  {
    id: 'feature-speed',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Instant Generation',
    desc: 'AI processes your requirements in seconds, not hours.',
  },
  {
    id: 'feature-quality',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'High Coverage',
    desc: 'Generates positive, negative, and edge-case scenarios.',
  },
  {
    id: 'feature-export',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: 'Export Ready',
    desc: 'Export to CSV, Excel, or Jira with one click.',
  },
]

/* ── How it works steps ─────────────────────────────────────── */
const steps = [
  { id: 'step-paste',    num: '01', title: 'Paste Requirements', desc: 'Copy your user stories, BRDs, or any requirements text into the editor.' },
  { id: 'step-generate', num: '02', title: 'Generate with AI',   desc: 'Our AI model analyses context and produces structured test cases instantly.' },
  { id: 'step-export',   num: '03', title: 'Review & Export',    desc: 'Edit, refine, and export your test cases to any project management tool.' },
]

export default function HomePage() {
  const [requirements, setRequirements] = useState('')
  const [fileName, setFileName]         = useState(null)
  const [isDragging, setIsDragging]     = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setFileName(file.name)
  }

  const handleGenerate = async () => {
    if (!requirements.trim() && !fileName) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setIsLoading(false)
  }

  const canGenerate = requirements.trim().length > 0 || !!fileName

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', width: '100%' }}>
      <Navbar />

      {/* Background radial glows */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 50% at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.10) 0%, transparent 70%)
          `,
        }}
      />

      <main style={{ position: 'relative', zIndex: 1, width: '100%' }}>

        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <section style={{ paddingTop: '8rem', paddingBottom: '3rem', width: '100%' }}>
          <div style={{ ...container, textAlign: 'center' }}>

            {/* Badge */}
            <div
              id="hero-badge"
              className="animate-fade-in-up"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.375rem 1rem', borderRadius: '9999px',
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.35)',
                color: '#818cf8', fontSize: '0.75rem', fontWeight: 600,
                marginBottom: '2rem',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1', display: 'inline-block' }} />
              Powered by Gemini AI
            </div>

            {/* Headline */}
            <h1
              id="hero-headline"
              className="animate-fade-in-up-delay"
              style={{
                fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #818cf8 50%, #06b6d4 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 6s ease infinite, fadeInUp 0.6s ease 0.15s both',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Generate Test Cases<br />from Requirements
            </h1>

            {/* Subtitle */}
            <p
              id="hero-subtitle"
              className="animate-fade-in-up-delay-2"
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.7,
                color: 'var(--color-text-muted)',
                maxWidth: '520px',
                margin: '0 auto 2.5rem',
              }}
            >
              Paste your user stories or upload a document — our AI instantly crafts
              comprehensive, structured test cases so your team ships with confidence.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FEATURE PILLS
        ══════════════════════════════════════════════ */}
        <section style={{ paddingBottom: '2.5rem', width: '100%' }}>
          <div style={{ ...container }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
            }}>
              {features.map((f) => (
                <div
                  key={f.id}
                  id={f.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    flex: '1 1 200px', maxWidth: '240px',
                    transition: 'transform 0.2s',
                    cursor: 'default',
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

        {/* ══════════════════════════════════════════════
            MAIN INPUT CARD
        ══════════════════════════════════════════════ */}
        <section id="generate" style={{ paddingBottom: '5rem', width: '100%' }}>
          <div style={container}>
            <div
              style={{
                width: '100%',
                borderRadius: '1.25rem',
                overflow: 'hidden',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* Card header */}
              <div
                style={{
                  padding: '1.25rem 2rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: '0.5rem',
                    background: 'rgba(99,102,241,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                    Requirements Input
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Paste your requirements or upload a file below
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Textarea */}
                <div>
                  <label
                    htmlFor="requirements-input"
                    style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}
                  >
                    Paste Requirements
                  </label>
                  <textarea
                    id="requirements-input"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    rows={8}
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
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                    onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                  <p style={{ fontSize: '0.75rem', textAlign: 'right', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
                    {requirements.length} characters
                  </p>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>

                {/* File Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                    Upload a File
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
                      boxSizing: 'border-box',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      id="file-input"
                      type="file"
                      style={{ display: 'none' }}
                      accept=".txt,.pdf,.docx,.md,.csv"
                      onChange={handleFileChange}
                    />
                    {fileName ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#818cf8' }}>{fileName}</span>
                        <button
                          id="remove-file-btn"
                          onClick={(e) => { e.stopPropagation(); setFileName(null); fileInputRef.current.value = '' }}
                          style={{
                            fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.375rem',
                            background: 'rgba(239,68,68,0.15)', color: '#f87171',
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg style={{ margin: '0 auto 0.75rem', display: 'block' }} width="28" height="28" viewBox="0 0 24 24" fill="none"
                          stroke={isDragging ? '#6366f1' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

                {/* Generate Button */}
                <button
                  id="generate-btn"
                  onClick={handleGenerate}
                  disabled={!canGenerate || isLoading}
                  style={{
                    width: '100%', padding: '1rem', borderRadius: '0.75rem',
                    fontWeight: 700, fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                    border: 'none', outline: 'none',
                    background: canGenerate
                      ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)'
                      : 'rgba(255,255,255,0.06)',
                    color: canGenerate ? '#fff' : '#475569',
                    cursor: canGenerate && !isLoading ? 'pointer' : 'not-allowed',
                    animation: canGenerate && !isLoading ? 'pulse-glow 3s ease-in-out infinite' : 'none',
                    boxShadow: canGenerate ? '0 8px 32px rgba(99,102,241,0.35)' : 'none',
                    transition: 'transform 0.2s, opacity 0.2s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => { if (canGenerate && !isLoading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin-slow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                        <path d="M21 12a9 9 0 00-9-9" />
                      </svg>
                      Generating Test Cases…
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════ */}
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
