import Navbar from '../components/Navbar'

const S = {
  page:    { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:    { maxWidth: 820, margin: '0 auto', padding: '8rem 1.5rem 4rem' },
  badge:   {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.375rem 1rem', borderRadius: '9999px',
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
    color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
  },
  heading:  { fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' },
  sub:      { fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '2rem' },
  section:  { marginBottom: '2rem' },
  sectionH: { fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' },
  row:      {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    marginBottom: '0.5rem',
  },
  label:  { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' },
  value:  { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
}

const settingsGroups = [
  {
    group: 'AI Model',
    items: [
      { id: 'setting-model',   label: 'Model',       value: 'Gemini 1.5 Pro (planned)' },
      { id: 'setting-tokens',  label: 'Max Tokens',  value: '4096' },
      { id: 'setting-temp',    label: 'Temperature', value: '0.7' },
    ],
  },
  {
    group: 'Export Preferences',
    items: [
      { id: 'setting-format',  label: 'Default Export Format', value: 'CSV' },
      { id: 'setting-jira',    label: 'Jira Integration',      value: 'Not connected' },
    ],
  },
  {
    group: 'Application',
    items: [
      { id: 'setting-theme',   label: 'Theme',    value: 'Dark (default)' },
      { id: 'setting-version', label: 'Version',  value: '1.0.0' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>⚙️ Settings</div>
        <h1 style={S.heading}>Settings</h1>
        <p style={S.sub}>
          Configure your AI model preferences, export formats, and application behaviour.
        </p>
        {settingsGroups.map(g => (
          <div key={g.group} style={S.section}>
            <p style={S.sectionH}>{g.group}</p>
            {g.items.map(item => (
              <div key={item.id} id={item.id} style={S.row}>
                <span style={S.label}>{item.label}</span>
                <span style={S.value}>{item.value}</span>
              </div>
            ))}
          </div>
        ))}
        <p style={{ fontSize: '0.75rem', color: '#334155', textAlign: 'center', marginTop: '1.5rem' }}>
          Interactive settings controls are coming in a future story.
        </p>
      </div>
    </div>
  )
}
