import Navbar from '../components/Navbar'

const S = {
  page:    { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:    { maxWidth: 820, margin: '0 auto', padding: '8rem 1.5rem 4rem' },
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
    textAlign: 'center',
  },
}

export default function BugReportPage() {
  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>🐛 Bug Report Generator</div>
        <h1 style={S.heading}>AI Bug Report Generator</h1>
        <p style={S.sub}>
          Describe the issue you encountered and let AI generate a structured, professional bug report
          ready to paste into Jira, GitHub, or Linear.
        </p>
        <div style={S.card}>
          <svg style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} width="48" height="48"
            viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 6l4-4 4 4" /><path d="M12 2v8" />
            <path d="M20 13v1a8 8 0 01-16 0v-1" />
            <path d="M4 10h16" />
          </svg>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            🚧 Coming soon — Story 7. This feature is on the roadmap!
          </p>
        </div>
      </div>
    </div>
  )
}
