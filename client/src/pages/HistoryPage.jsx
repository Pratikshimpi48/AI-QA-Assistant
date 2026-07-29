import Navbar from '../components/Navbar'

const S = {
  page:    { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:    { maxWidth: 900, margin: '0 auto', padding: '8rem 1.5rem 4rem' },
  badge:   {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.375rem 1rem', borderRadius: '9999px',
    background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
    color: '#22d3ee', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
  },
  heading: { fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' },
  sub:     { fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '2rem' },
  card:    {
    borderRadius: '1rem', padding: '2rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    textAlign: 'center',
  },
}

export default function HistoryPage() {
  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>🕐 History</div>
        <h1 style={S.heading}>Generation History</h1>
        <p style={S.sub}>
          Browse all your past test case generation runs, re-download results, or pick up where you left off.
        </p>
        <div style={S.card}>
          <svg style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} width="48" height="48"
            viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            📭 No history yet. Generate test cases and they'll appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
