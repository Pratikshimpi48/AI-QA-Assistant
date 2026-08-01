import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import {
  getJiraConfig,
  getWatchlist,
  getJiraTicketDetails,
  generateJiraWorklog,
  saveJiraWorklog,
  getJiraWorklogs,
  deleteJiraWorklog,
} from '../services/api'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function JiraWorklogPage() {
  const { user } = useAuth()
  const [jiraConnected, setJiraConnected] = useState(false)
  const [jiraBaseUrl, setJiraBaseUrl]     = useState('')
  const [jiraEmail, setJiraEmail]         = useState('')

  // Step 1: Watchlist & Ticket selection
  const [watchlist, setWatchlist]         = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState('')
  const [ticketInput, setTicketInput]     = useState('')
  const [ticketDetails, setTicketDetails] = useState(null)
  const [fetchingTicket, setFetchingTicket] = useState(false)

  // Step 2: Inputs (Date, Time, User Notes)
  const [timeSpent, setTimeSpent]         = useState('1h 30m')
  const [worklogDate, setWorklogDate]     = useState(() => new Date().toISOString().split('T')[0])
  const [userNotes, setUserNotes]         = useState('')

  // Step 3: AI Worklog Result & Editor
  const [generating, setGenerating]       = useState(false)
  const [generatedWorklog, setGeneratedWorklog] = useState(null)
  const [editableSummary, setEditableSummary]   = useState('')
  const [editableJiraFormat, setEditableJiraFormat] = useState('')

  // History & Toast Notifications
  const [savedLogs, setSavedLogs]         = useState([])
  const [savingLog, setSavingLog]         = useState(false)
  const [toastMsg, setToastMsg]           = useState('')
  const [errorMsg, setErrorMsg]           = useState('')

  useEffect(() => {
    loadJiraConfigAndWatchlist()
    loadSavedWorklogs()
  }, [])

  const loadJiraConfigAndWatchlist = async () => {
    try {
      const cfgRes = await getJiraConfig()
      if (cfgRes?.config?.hasToken) {
        setJiraConnected(true)
        setJiraBaseUrl(cfgRes.config.jiraBaseUrl || '')
        setJiraEmail(cfgRes.config.jiraEmail || '')
      }
    } catch { /* ignore */ }

    try {
      const wlRes = await getWatchlist(user?.id)
      if (wlRes?.watchlist) {
        setWatchlist(wlRes.watchlist)
      }
    } catch { /* ignore */ }
  }

  const loadSavedWorklogs = async () => {
    try {
      const res = await getJiraWorklogs()
      if (res?.worklogs) setSavedLogs(res.worklogs)
    } catch { /* ignore */ }
  }

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  // STEP 1 HANDLER: Fetch Ticket Details & User Comments
  const handleFetchTicket = async (tId) => {
    const targetId = (tId || ticketInput || selectedTicketId).trim().toUpperCase()
    if (!targetId) {
      setErrorMsg('Please enter or select a Jira Ticket ID.')
      return
    }
    setErrorMsg('')
    setFetchingTicket(true)
    setGeneratedWorklog(null) // Reset step 3 on new fetch

    try {
      const res = await getJiraTicketDetails(targetId)
      if (res?.ticket) {
        setTicketDetails(res.ticket)
        setSelectedTicketId(res.ticket.ticketId)
        setTicketInput(res.ticket.ticketId)
        showToast(`✅ Fetched ticket ${res.ticket.ticketId}! Auto-opened configuration form below.`)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || `Failed to fetch ticket ${targetId}. Please check credentials in Settings.`)
    } finally {
      setFetchingTicket(false)
    }
  }

  // STEP 2 - BUTTON 1 HANDLER: Generate Work Description from Comments
  const handleGenerate = async () => {
    const targetId = (selectedTicketId || ticketInput).trim().toUpperCase()
    if (!targetId && !ticketDetails) {
      setErrorMsg('Please enter a Jira ticket ID or select one from your Watchlist.')
      return
    }

    setErrorMsg('')
    setGenerating(true)
    setGeneratedWorklog(null)

    try {
      const res = await generateJiraWorklog({
        ticketId: targetId,
        ticketData: ticketDetails,
        userNotes,
        timeSpent,
        worklogDate,
      })

      if (res?.worklog) {
        setGeneratedWorklog(res.worklog)
        setEditableSummary(res.worklog.worklogSummary || '')
        setEditableJiraFormat(res.worklog.formattedJiraWorklog || '')
        showToast('✨ Work Description generated! Review and edit your summary below.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate work log summary.')
    } finally {
      setGenerating(false)
    }
  }

  // STEP 2 - BUTTON 2 HANDLER: Post Work Log on Jira (User-Initiated)
  const handlePostToJira = () => {
    const formattedText = editableJiraFormat || editableSummary || generatedWorklog?.formattedJiraWorklog || ''
    if (!formattedText) {
      showToast('⚠️ Please click "Generate Work Description" first before posting to Jira.')
      return
    }

    // 1. Copy formatted work log to user's clipboard
    navigator.clipboard.writeText(formattedText)

    // 2. Open Jira Ticket Page in a new browser tab for 1-click manual paste
    const targetTicketId = ticketDetails?.ticketId || selectedTicketId || ticketInput
    const baseUrl = ticketDetails?.jiraBaseUrl || jiraBaseUrl
    const ticketUrl = baseUrl ? `${baseUrl}/browse/${targetTicketId}` : null

    if (ticketUrl) {
      window.open(ticketUrl, '_blank')
      showToast(`🚀 Copied Work Log to clipboard & opened ${targetTicketId} in Jira!`)
    } else {
      showToast('📋 Copied Work Log to clipboard! (Connect Jira in Settings to auto-open ticket URL)')
    }
  }

  const handleCopyClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    showToast('📋 Copied Work Description to clipboard! Ready to paste into Jira.')
  }

  const handleSaveLog = async () => {
    if (!generatedWorklog) return
    setSavingLog(true)
    try {
      const targetId = selectedTicketId || ticketInput || generatedWorklog.ticketId
      const payload = {
        jiraTicketId: targetId,
        jiraBaseUrl: ticketDetails?.jiraBaseUrl || jiraBaseUrl,
        summary: ticketDetails?.summary || generatedWorklog.summary,
        timeSpent,
        worklogDate,
        worklogSummary: editableSummary,
        bulletPoints: generatedWorklog.bulletPoints || [],
        formattedJiraWorklog: editableJiraFormat,
      }

      await saveJiraWorklog(payload)
      showToast('💾 Work log saved to local history!')
      loadSavedWorklogs()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save work log.')
    } finally {
      setSavingLog(false)
    }
  }

  const handleDeleteLog = async (id) => {
    try {
      await deleteJiraWorklog(id)
      setSavedLogs(prev => prev.filter(l => (l._id || l.id) !== id))
      showToast('Removed from work log history.')
    } catch { /* ignore */ }
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '7.5rem 1.5rem 4rem' }}>
        
        {/* Toast Notification */}
        {toastMsg && (
          <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.5)',
            borderRadius: '0.75rem', padding: '0.9rem 1.25rem', color: '#f8fafc',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(99,102,241,0.25)',
            fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', boxShadow: '0 0 16px rgba(99,102,241,0.4)',
            }}>
              ⏱️
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                Jira Work Log Assistant
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                Fetch your posted Jira comments, set work log date & time spent, and generate your personalized Work Description.
              </p>
            </div>
          </div>

          {/* Connection Status Banner */}
          <div style={{
            marginTop: '1.25rem', padding: '0.85rem 1.25rem', borderRadius: '0.75rem',
            background: jiraConnected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: jiraConnected ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{jiraConnected ? '🟢' : '⚠️'}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: jiraConnected ? '#4ade80' : '#fbbf24' }}>
                {jiraConnected
                  ? `Connected as ${jiraEmail} (${jiraBaseUrl})`
                  : 'Jira is not connected. Connect in Settings to auto-fetch live ticket comments.'}
              </span>
            </div>
            {!jiraConnected && (
              <Link
                to="/settings"
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.78rem',
                  fontWeight: 700, background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24', textDecoration: 'none',
                }}
              >
                Connect Jira →
              </Link>
            )}
          </div>
        </div>

        {errorMsg && (
          <div style={{
            marginBottom: '1.5rem', padding: '0.85rem 1.15rem', borderRadius: '0.75rem',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: '0.85rem', fontWeight: 600,
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* STEP 1: INITIAL TICKET ID INPUT FIELD & FETCH BUTTON */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '1rem', padding: '1.75rem', marginBottom: '2rem', backdropFilter: 'blur(16px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>1️⃣ Step 1: Enter Jira Ticket ID</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: watchlist.length > 0 ? '1fr 1.2fr' : '1fr', gap: '1.25rem', alignItems: 'end' }}>
            {/* Watchlist Quick Picker */}
            {watchlist.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pick from Watchlist
                </label>
                <select
                  value={selectedTicketId}
                  onChange={e => {
                    const val = e.target.value
                    setSelectedTicketId(val)
                    setTicketInput(val)
                    if (val) handleFetchTicket(val)
                  }}
                  style={{
                    width: '100%', padding: '0.75rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">-- Select from Watchlist ({watchlist.length} tickets) --</option>
                  {watchlist.map(item => (
                    <option key={item._id || item.id} value={item.jiraTicketId}>
                      [{item.jiraTicketId}] {item.summary ? item.summary.slice(0, 45) : 'Ticket'} ({item.currentStatus || 'Status'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ticket ID Input + Fetch Button */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Jira Ticket ID
              </label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  type="text"
                  value={ticketInput}
                  onChange={e => setTicketInput(e.target.value.toUpperCase())}
                  placeholder="e.g. ASB-2239"
                  style={{
                    flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#f8fafc', fontSize: '0.95rem', outline: 'none', fontFamily: 'monospace', fontWeight: 800,
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleFetchTicket(ticketInput)}
                  disabled={fetchingTicket || !ticketInput.trim()}
                  style={{
                    padding: '0.75rem 1.35rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none',
                    color: '#ffffff', cursor: fetchingTicket || !ticketInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: fetchingTicket || !ticketInput.trim() ? 0.6 : 1, whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  {fetchingTicket ? 'Fetching...' : '🔍 Fetch Comments'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: AUTO-OPENED WORK LOG CONFIGURATION FORM & USER COMMENTS INSPECTOR */}
        {ticketDetails && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '1rem', padding: '1.75rem', marginBottom: '2.5rem', backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 35px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>2️⃣ Step 2: Work Log Details & Comments Inspector</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: '9999px',
                  background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#818cf8', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'monospace',
                }}>
                  [{ticketDetails.ticketId}]
                </span>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: '9999px',
                  background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {ticketDetails.status}
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 1.25rem', lineHeight: 1.4 }}>
              {ticketDetails.summary}
            </h3>

            {/* Inputs Grid: Date, Time Spent & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📅 Work Log Date
                </label>
                <input
                  type="date"
                  value={worklogDate}
                  onChange={e => setWorklogDate(e.target.value)}
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⏱️ Time Spent
                </label>
                <input
                  type="text"
                  value={timeSpent}
                  onChange={e => setTimeSpent(e.target.value)}
                  placeholder="e.g. 2h 30m, 45m, 1d"
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📝 Extra Notes (Optional)
                </label>
                <input
                  type="text"
                  value={userNotes}
                  onChange={e => setUserNotes(e.target.value)}
                  placeholder="e.g. Verified API response timing"
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Comments Inspector Box */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  💬 {ticketDetails.userCommentsCount || ticketDetails.commentsList?.length || 0} Comment(s) Posted by You ({jiraEmail || 'Connected Account'})
                </span>
                {ticketDetails.totalCommentsCount > (ticketDetails.userCommentsCount || ticketDetails.commentsList?.length || 0) && (
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    ({ticketDetails.totalCommentsCount - (ticketDetails.userCommentsCount || 0)} comment(s) from other users excluded)
                  </span>
                )}
              </div>

              {ticketDetails.commentsList && ticketDetails.commentsList.length > 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.6rem',
                  maxHeight: '220px', overflowY: 'auto', paddingRight: '0.25rem',
                }}>
                  {ticketDetails.commentsList.map((c, idx) => (
                    <div key={idx} style={{
                      padding: '0.7rem 0.9rem', borderRadius: '0.5rem',
                      background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4ade80' }}>
                          👤 {c.author} (You)
                        </span>
                        {c.dateStr && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {c.dateStr}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                        {c.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
                  💬 No comments posted by your account on this ticket yet. AI will generate summary using ticket context.
                </div>
              )}
            </div>

            {/* TWO ACTION BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: generatedWorklog ? '1.5rem' : 0 }}>
              
              {/* BUTTON 1: Generate Work Description */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  padding: '0.85rem 1.25rem', borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none', color: '#ffffff', fontSize: '0.9rem', fontWeight: 800,
                  cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1,
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                {generating ? (
                  <span>✨ Evaluating Comments...</span>
                ) : (
                  <span>✨ Generate Work Description from Comments</span>
                )}
              </button>

              {/* BUTTON 2: Post Work Log to Jira (Frontend 1-Click Copy & Open) */}
              <button
                type="button"
                onClick={handlePostToJira}
                style={{
                  padding: '0.85rem 1.25rem', borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  border: 'none', color: '#ffffff', fontSize: '0.9rem', fontWeight: 800,
                  cursor: 'pointer', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <span>🚀 Post Work Log on Jira</span>
              </button>

            </div>

            {/* GENERATED FORMATTED JIRA COMMENT EDITOR (INTEGRATED DIRECTLY IN STEP 2) */}
            {generatedWorklog && (
              <div style={{
                marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                    💬 Formatted Jira Comment (Ready to Paste)
                  </label>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyClipboard(editableJiraFormat || editableSummary)}
                      style={{
                        padding: '0.45rem 0.95rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 700,
                        background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                      }}
                    >
                      <span>📋 Copy Comment</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveLog}
                      disabled={savingLog}
                      style={{
                        padding: '0.45rem 0.95rem', borderRadius: '0.5rem', fontSize: '0.78rem', fontWeight: 700,
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none',
                        color: '#ffffff', cursor: savingLog ? 'not-allowed' : 'pointer', opacity: savingLog ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 10px rgba(34,197,94,0.3)',
                      }}
                    >
                      <span>{savingLog ? 'Saving...' : '💾 Save Entry'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={editableJiraFormat || editableSummary}
                  onChange={e => {
                    setEditableJiraFormat(e.target.value)
                    setEditableSummary(e.target.value)
                  }}
                  style={{
                    width: '100%', padding: '0.9rem', borderRadius: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#f8fafc', fontSize: '0.875rem', outline: 'none', lineHeight: 1.55,
                    resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* SAVED WORK LOG HISTORY SECTION */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '1rem', padding: '1.5rem', backdropFilter: 'blur(12px)',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📜 Saved Work Log History</span>
          </h2>

          {savedLogs.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>No saved work logs yet</div>
              <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                Work descriptions that you generate and save will be listed here for reference.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {savedLogs.map(log => {
                const id = log._id || log.id
                return (
                  <div
                    key={id}
                    style={{
                      padding: '1.15rem 1.25rem', borderRadius: '0.75rem',
                      background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8', fontFamily: 'monospace' }}>
                          [{log.jiraTicketId}]
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9' }}>
                          {log.summary || 'Work Log'}
                        </span>
                        {log.worklogDate && (
                          <span style={{
                            padding: '0.15rem 0.55rem', borderRadius: '9999px',
                            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                            color: '#60a5fa', fontSize: '0.72rem', fontWeight: 700,
                          }}>
                            📅 {log.worklogDate}
                          </span>
                        )}
                        {log.timeSpent && (
                          <span style={{
                            padding: '0.15rem 0.55rem', borderRadius: '9999px',
                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            color: '#818cf8', fontSize: '0.72rem', fontWeight: 700,
                          }}>
                            ⏱️ {log.timeSpent}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {timeAgo(log.createdAt)}
                        </span>
                        <button
                          onClick={() => handleCopyClipboard(log.worklogSummary || log.formattedJiraWorklog)}
                          title="Copy Work Description"
                          style={{
                            padding: '0.3rem 0.65rem', borderRadius: '0.375rem', fontSize: '0.75rem',
                            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                            color: '#818cf8', cursor: 'pointer', fontWeight: 600,
                          }}
                        >
                          📋 Copy
                        </button>
                        <button
                          onClick={() => handleDeleteLog(id)}
                          title="Delete Entry"
                          style={{
                            padding: '0.3rem 0.65rem', borderRadius: '0.375rem', fontSize: '0.75rem',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171', cursor: 'pointer',
                          }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '0.8rem', color: '#cbd5e1', margin: 0,
                      lineHeight: 1.5, background: 'rgba(0,0,0,0.2)',
                      padding: '0.75rem 0.85rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap',
                    }}>
                      {log.worklogSummary || log.formattedJiraWorklog}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
