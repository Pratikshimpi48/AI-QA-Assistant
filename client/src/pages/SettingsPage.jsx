import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getJiraConfig, saveJiraConfig, deleteJiraConfig, getDashboardStats } from '../services/api'
import { getGuestStats } from '../utils/guestSession'
import { THEMES, getStoredTheme, applyTheme } from '../services/theme'

const S = {
  page:     { background: 'var(--color-bg)', minHeight: '100vh', transition: 'background 0.3s ease' },
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
  sectionH: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.875rem' },
  card:     {
    borderRadius: '0.875rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    overflow: 'hidden', transition: 'background 0.3s ease, border-color 0.3s ease',
  },
  row:      {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid var(--color-border)',
  },
  label:    { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' },
  value:    { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  input:    {
    width: '100%', padding: '0.7rem 0.875rem', borderRadius: '0.5rem',
    background: 'rgba(0,0,0,0.25)', border: '1px solid var(--color-border)',
    color: 'var(--color-text)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
}

export default function SettingsPage() {
  const { isAuthenticated } = useAuth()

  // Theme state
  const [currentTheme, setCurrentTheme]   = useState(() => getStoredTheme())

  // Jira config state
  const [jiraConfig, setJiraConfig]       = useState(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [editMode, setEditMode]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configMsg, setConfigMsg]         = useState({ text: '', type: '' })

  // Token Usage & Stats state
  const [tokensUsed, setTokensUsed]       = useState(0)

  // Form fields
  const [jiraBaseUrl, setJiraBaseUrl]     = useState('')
  const [jiraEmail, setJiraEmail]         = useState('')
  const [jiraApiToken, setJiraApiToken]   = useState('')

  useEffect(() => {
    const handleThemeChange = (e) => setCurrentTheme(e.detail)
    window.addEventListener('themeChange', handleThemeChange)
    return () => window.removeEventListener('themeChange', handleThemeChange)
  }, [])

  useEffect(() => {
    // Fetch stats for token count calculation
    if (isAuthenticated) {
      getDashboardStats()
        .then(res => setTokensUsed(res.stats?.tokensUsed || 0))
        .catch(() => {})
    } else {
      const gStats = getGuestStats()
      setTokensUsed(gStats.tokensUsed || 0)
    }

    // Load Jira config (checks backend + local storage fallback for guest/session recovery)
    getJiraConfig()
      .then(res => {
        setJiraConfig(res.config)
        if (res.config) {
          setJiraBaseUrl(res.config.jiraBaseUrl || '')
          setJiraEmail(res.config.jiraEmail || '')
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false))
  }, [isAuthenticated])

  const handleThemeSelect = (themeId) => {
    applyTheme(themeId)
    setCurrentTheme(themeId)
  }

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

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0]

  const dynamicGroups = [
    {
      group: 'AI Model & Token Consumption',
      items: [
        { id: 'setting-model',    label: 'Primary Model',    value: 'Gemini 2.0 Flash' },
        { id: 'setting-fallback', label: 'Fallback Model',   value: 'Groq Llama 3.3 70B' },
        { id: 'setting-tokens',   label: 'Max Tokens / Req', value: '4,096 tokens' },
        {
          id: 'setting-tokens-used',
          label: 'Tokens Used (Lifetime)',
          valueComponent: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{
                fontSize: '0.875rem', fontWeight: 800, color: '#4ade80',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                padding: '0.2rem 0.65rem', borderRadius: '9999px',
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              }}>
                ⚡ {tokensUsed.toLocaleString()} tokens
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                ({isAuthenticated ? 'Account usage' : 'Guest session usage'})
              </span>
            </div>
          ),
        },
        { id: 'setting-temp', label: 'Temperature', value: '0.7' },
      ],
    },
    {
      group: 'Export Preferences',
      items: [
        { id: 'setting-format', label: 'Default Export Format', value: 'CSV / Excel' },
      ],
    },
    {
      group: 'Application Info',
      items: [
        {
          id: 'setting-theme',
          label: 'Current Theme',
          valueComponent: (
            <span style={{
              fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-hover)',
              background: 'rgba(99,102,241,0.12)', border: '1px solid var(--color-border)',
              padding: '0.25rem 0.75rem', borderRadius: '9999px',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              🎨 {activeThemeObj.name} ({activeThemeObj.badge})
            </span>
          ),
        },
        { id: 'setting-version', label: 'Version', value: '2.0.0' },
      ],
    },
  ]

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        <div style={S.badge}>⚙️ Settings</div>
        <h1 style={S.heading}>Settings</h1>
        <p style={S.sub}>
          Configure your AI model preferences, personalize application themes, track token consumption, and manage Jira integration.
        </p>

        {/* Theme Picker Section */}
        <div style={S.section}>
          <p style={S.sectionH}>🎨 Application Theme Selector</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1rem',
          }}>
            {THEMES.map(t => {
              const isActive = currentTheme === t.id
              return (
                <div
                  key={t.id}
                  id={`theme-card-${t.id}`}
                  onClick={() => handleThemeSelect(t.id)}
                  style={{
                    borderRadius: '0.875rem',
                    background: 'var(--color-surface)',
                    border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    padding: '1.15rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isActive ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {t.name}
                    </span>
                    {isActive ? (
                      <span style={{
                        fontSize: '0.675rem', fontWeight: 800, color: '#4ade80',
                        background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                        padding: '0.15rem 0.5rem', borderRadius: '9999px',
                      }}>
                        ✓ Active
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)',
                        background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.45rem', borderRadius: '0.375rem',
                      }}>
                        {t.badge}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                    {t.previewColors.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: color,
                          border: '1.5px solid rgba(255,255,255,0.15)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      />
                    ))}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {t.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dynamic Settings Groups */}
        {dynamicGroups.map(g => (
          <div key={g.group} style={S.section}>
            <p style={S.sectionH}>{g.group}</p>
            <div style={S.card}>
              {g.items.map((item, idx) => (
                <div
                  key={item.id} id={item.id}
                  style={{ ...S.row, borderBottom: idx === g.items.length - 1 ? 'none' : S.row.borderBottom }}
                >
                  <span style={S.label}>{item.label}</span>
                  {item.valueComponent ? item.valueComponent : <span style={S.value}>{item.value}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Jira Integration Section */}
        <div style={S.section}>
          <p style={S.sectionH}>🔗 Jira Integration</p>

          {configLoading ? (
            <div style={{
              padding: '1.5rem', borderRadius: '0.875rem',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem',
            }}>
              Loading Jira configuration...
            </div>
          ) : (
            <div style={{ ...S.card, border: jiraConfig?.connected ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--color-border)' }}>
              {/* Status Bar */}
              <div style={{
                ...S.row, borderBottom: '1px solid var(--color-border)',
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
                    color: jiraConfig?.connected ? '#4ade80' : 'var(--color-text-muted)',
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
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Jira URL</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', fontFamily: 'monospace' }}>{jiraConfig.jiraBaseUrl}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Account</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)' }}>{jiraConfig.jiraEmail}</p>
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
                  <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    Connect your Jira account to enable <strong style={{ color: 'var(--color-text)' }}>AI Duplicate Detection</strong> and <strong style={{ color: 'var(--color-text)' }}>MR Status Notifications</strong>.
                    {' '}Your API token is stored securely and never exposed to the browser.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        Generate at: <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-hover)' }}>Atlassian API Tokens</a>
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
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
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
                          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)',
                          color: 'var(--color-text-muted)', cursor: 'pointer',
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

          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            After connecting, use <strong style={{ color: 'var(--color-primary-hover)' }}>Jira Watchlist</strong> in the nav to add tickets and receive notifications when their MR status changes to Ready for QA.
          </p>
        </div>
      </div>
    </div>
  )
}
