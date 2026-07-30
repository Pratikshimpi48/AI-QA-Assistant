import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getJiraConfig, saveJiraConfig, deleteJiraConfig } from '../services/api'

const S = {
  page:     { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:     { maxWidth: 820, margin: '0 auto', padding: '8rem 1.5rem 4rem' },
  badge:    {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.375rem 1rem', borderRadius: '9999px',
    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
    color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
  },
  heading:  { fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' },
  sub:      { fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '2.5rem' },
  section:  { marginBottom: '2.25rem' },
  sectionH: { fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.875rem' },
  card:     {
    borderRadius: '0.875rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    overflow: 'hidden',
  },
  row:      {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  label:    { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' },
  value:    { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  input:    {
    width: '100%', padding: '0.7rem 0.875rem', borderRadius: '0.5rem',
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
}

const staticGroups = [
  {
    group: 'AI Model',
    items: [
      { id: 'setting-model',   label: 'Primary Model',   value: 'Gemini 2.0 Flash' },
      { id: 'setting-fallback',label: 'Fallback Model',  value: 'Groq Llama 3.3 70B' },
      { id: 'setting-tokens',  label: 'Max Tokens',      value: '4096' },
      { id: 'setting-temp',    label: 'Temperature',     value: '0.7' },
    ],
  },
  {
    group: 'Export Preferences',
    items: [
      { id: 'setting-format',  label: 'Default Export Format', value: 'CSV / Excel' },
    ],
  },
  {
    group: 'Application',
    items: [
      { id: 'setting-theme',   label: 'Theme',    value: 'Dark (default)' },
      { id: 'setting-version', label: 'Version',  value: '2.0.0' },
    ],
  },
]

export default function SettingsPage() {
  const { isAuthenticated } = useAuth()

  // Jira config state
  const [jiraConfig, setJiraConfig]     = useState(null)    // { jiraBaseUrl, jiraEmail, connected }
  const [configLoading, setConfigLoading] = useState(true)
  const [editMode, setEditMode]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configMsg, setConfigMsg]         = useState({ text: '', type: '' })

  // Form fields
  const [jiraBaseUrl, setJiraBaseUrl]   = useState('')
  const [jiraEmail, setJiraEmail]       = useState('')
  const [jiraApiToken, setJiraApiToken] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { setConfigLoading(false); return }
    ;(async () => {
      try {
        const res = await getJiraConfig()
        setJiraConfig(res.config)
        if (res.config) {
          setJiraBaseUrl(res.config.jiraBaseUrl || '')
          setJiraEmail(res.config.jiraEmail || '')
        }
      } catch { /* not configured yet */ }
      setConfigLoading(false)
    })()
  }, [isAuthenticated])

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    if (!jiraBaseUrl.trim() || !jiraEmail.trim() || !jiraApiToken.trim()) {
      setConfigMsg({ text: 'All three Jira fields are required.', type: 'error' })
      return
    }
    setSaving(true)
    setConfigMsg({ text: '', type: '' })
    try {
      const res = await saveJiraConfig({
        jiraBaseUrl: jiraBaseUrl.trim().replace(/\/$/, ''),
        jiraEmail:   jiraEmail.trim(),
        jiraApiToken: jiraApiToken.trim(),
      })
      setJiraConfig(res.config)
      setEditMode(false)
      setJiraApiToken('')
      setConfigMsg({ text: '✅ Jira connected successfully!', type: 'success' })
    } catch (err) {
      setConfigMsg({ text: `❌ ${err.message}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Jira? Your watchlist will stop monitoring tickets.')) return
    setDisconnecting(true)
    try {
      await deleteJiraConfig()
      setJiraConfig(null)
      setJiraBaseUrl(''); setJiraEmail(''); setJiraApiToken('')
      setEditMode(false)
      setConfigMsg({ text: 'Jira disconnected.', type: 'info' })
    } catch (err) {
      setConfigMsg({ text: `Failed to disconnect: ${err.message}`, type: 'error' })
    } finally {
      setDisconnecting(false)
    }
  }

  const msgColors = {
    success: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#4ade80' },
    error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171' },
    info:    { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', color: '#818cf8' },
  }

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>⚙️ Settings</div>
        <h1 style={S.heading}>Settings</h1>
        <p style={S.sub}>
          Configure your AI model preferences, Jira integration, export formats, and application behaviour.
        </p>

        {/* Static Settings Groups */}
        {staticGroups.map(g => (
          <div key={g.group} style={S.section}>
            <p style={S.sectionH}>{g.group}</p>
            <div style={S.card}>
              {g.items.map((item, idx) => (
                <div
                  key={item.id} id={item.id}
                  style={{ ...S.row, borderBottom: idx === g.items.length - 1 ? 'none' : S.row.borderBottom }}
                >
                  <span style={S.label}>{item.label}</span>
                  <span style={S.value}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Jira Integration Section */}
        <div style={S.section}>
          <p style={S.sectionH}>🔗 Jira Integration</p>

          {!isAuthenticated ? (
            <div style={{
              padding: '1.25rem', borderRadius: '0.875rem',
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
              color: '#64748b', fontSize: '0.875rem', textAlign: 'center',
            }}>
              Please <strong style={{ color: '#818cf8' }}>log in</strong> to configure your Jira integration.
            </div>
          ) : configLoading ? (
            <div style={{
              padding: '1.5rem', borderRadius: '0.875rem',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              textAlign: 'center', color: '#475569', fontSize: '0.875rem',
            }}>
              Loading Jira configuration...
            </div>
          ) : (
            <div style={{ ...S.card, border: jiraConfig?.connected ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--color-border)' }}>
              {/* Status Bar */}
              <div style={{
                ...S.row, borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: jiraConfig?.connected ? 'rgba(34,197,94,0.05)' : 'transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: jiraConfig?.connected ? '#22c55e' : '#475569',
                    boxShadow: jiraConfig?.connected ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
                  }} />
                  <span style={{ ...S.label }}>Jira Connection</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: jiraConfig?.connected ? '#4ade80' : '#64748b',
                  }}>
                    {jiraConfig?.connected ? '✅ Connected' : '⚪ Not Connected'}
                  </span>
                </div>
              </div>

              {/* Connected info */}
              {jiraConfig?.connected && !editMode && (
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Jira URL</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>{jiraConfig.jiraBaseUrl}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Account</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{jiraConfig.jiraEmail}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <button
                      onClick={() => setEditMode(true)}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                        color: '#818cf8', cursor: 'pointer',
                      }}
                    >
                      ✏️ Edit Credentials
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#f87171', cursor: disconnecting ? 'not-allowed' : 'pointer', opacity: disconnecting ? 0.6 : 1,
                      }}
                    >
                      {disconnecting ? 'Disconnecting...' : '🔌 Disconnect'}
                    </button>
                  </div>
                </div>
              )}

              {/* Connect / Edit Form */}
              {(!jiraConfig?.connected || editMode) && (
                <form onSubmit={handleSaveConfig} style={{ padding: '1.25rem' }}>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                    Connect your Jira account to enable <strong style={{ color: '#94a3b8' }}>AI Duplicate Detection</strong> and <strong style={{ color: '#94a3b8' }}>MR Status Notifications</strong>.
                    {' '}Your API token is stored securely and never exposed to the browser.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Jira Base URL
                      </label>
                      <input
                        id="jira-base-url-input"
                        type="url"
                        placeholder="https://yourcompany.atlassian.net"
                        value={jiraBaseUrl}
                        onChange={e => setJiraBaseUrl(e.target.value)}
                        required
                        style={S.input}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Jira Account Email
                      </label>
                      <input
                        id="jira-email-input"
                        type="email"
                        placeholder="you@company.com"
                        value={jiraEmail}
                        onChange={e => setJiraEmail(e.target.value)}
                        required
                        style={S.input}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Jira API Token
                      </label>
                      <input
                        id="jira-api-token-input"
                        type="password"
                        placeholder={jiraConfig?.connected ? '••••••••••••••••••• (leave blank to keep current)' : 'Paste your Jira API token'}
                        value={jiraApiToken}
                        onChange={e => setJiraApiToken(e.target.value)}
                        required={!jiraConfig?.connected}
                        style={S.input}
                      />
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: '#334155' }}>
                        Generate at: <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>Atlassian API Tokens</a>
                      </p>
                    </div>
                  </div>

                  {configMsg.text && (
                    <div style={{
                      marginTop: '1rem', padding: '0.65rem 1rem', borderRadius: '0.5rem',
                      background: msgColors[configMsg.type]?.bg,
                      border: `1px solid ${msgColors[configMsg.type]?.border}`,
                      color: msgColors[configMsg.type]?.color,
                      fontSize: '0.82rem',
                    }}>
                      {configMsg.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1.25rem' }}>
                    <button
                      id="jira-save-config-btn"
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '0.65rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1, boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                      }}
                    >
                      {saving ? '🔄 Connecting...' : '🔗 Connect Jira'}
                    </button>
                    {editMode && (
                      <button
                        type="button"
                        onClick={() => { setEditMode(false); setJiraApiToken(''); setConfigMsg({ text: '', type: '' }) }}
                        style={{
                          padding: '0.65rem 1.15rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#94a3b8', cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Success message (outside form) */}
              {configMsg.text && jiraConfig?.connected && !editMode && (
                <div style={{
                  margin: '0 1.25rem 1.25rem', padding: '0.65rem 1rem', borderRadius: '0.5rem',
                  background: msgColors[configMsg.type]?.bg,
                  border: `1px solid ${msgColors[configMsg.type]?.border}`,
                  color: msgColors[configMsg.type]?.color,
                  fontSize: '0.82rem',
                }}>
                  {configMsg.text}
                </div>
              )}
            </div>
          )}

          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: '#334155', lineHeight: 1.6 }}>
            After connecting, use <strong style={{ color: '#6366f1' }}>Jira Watchlist</strong> in the nav to add tickets and receive notifications when their MR status changes to Ready for QA.
          </p>
        </div>
      </div>
    </div>
  )
}
