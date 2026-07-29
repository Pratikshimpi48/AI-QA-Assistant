import Navbar from '../components/Navbar'

const S = {
  page:   { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:   { maxWidth: 1000, margin: '0 auto', padding: '8rem 1.5rem 4rem' },
  badge:  {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.375rem 1rem', borderRadius: '9999px',
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
    color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
  },
  heading: { fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' },
  sub:     { fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginTop: '2.5rem' },
  card:    {
    borderRadius: '1rem', padding: '1.5rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  },
  cardNum: {
    fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem',
    background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
}

const stats = [
  { id: 'stat-runs',    label: 'Total Runs',      value: '0' },
  { id: 'stat-cases',  label: 'Test Cases Made',  value: '0' },
  { id: 'stat-files',  label: 'Files Processed',  value: '0' },
  { id: 'stat-saved',  label: 'Hours Saved Est.',  value: '0h' },
]

export default function DashboardPage() {
  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>📊 Dashboard</div>
        <h1 style={S.heading}>Your QA Dashboard</h1>
        <p style={S.sub}>
          Track your test generation activity, review recent runs, and monitor your productivity at a glance.
        </p>
        <div style={S.grid}>
          {stats.map(s => (
            <div key={s.id} id={s.id} style={S.card}>
              <div style={S.cardNum}>{s.value}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ ...S.card, marginTop: '1.5rem', textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            📭 No activity yet. Generate your first test cases to see data here.
          </p>
        </div>
      </div>
    </div>
  )
}
