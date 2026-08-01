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
  deleteJiraCommentOnJira,
  postJiraWorklogDirect,
  deleteJiraWorklogDirectFromJira,
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

  // Step 2: Inputs (Date, Hours, Minutes, User Notes)
  const [timeHours, setTimeHours]         = useState('1')
  const [timeMinutes, setTimeMinutes]     = useState('30')
  const [worklogDate, setWorklogDate]     = useState(() => new Date().toISOString().split('T')[0])
  const [userNotes, setUserNotes]         = useState('')

  const getTimeSpentString = () => {
    const h = parseInt(timeHours, 10) || 0
    const m = parseInt(timeMinutes, 10) || 0
    if (h === 0 && m === 0) return '0m'
    const parts = []
    if (h > 0) parts.push(`${h}h`)
    if (m > 0) parts.push(`${m}m`)
    return parts.join(' ')
  }

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

  // History Filter States
  const [historyFilterSearch, setHistoryFilterSearch] = useState('')
  const [historyFilterDate, setHistoryFilterDate]     = useState('')

  const filteredSavedLogs = savedLogs.filter(log => {
    if (historyFilterSearch.trim()) {
      const q = historyFilterSearch.toLowerCase().trim()
      const tId = (log.jiraTicketId || '').toLowerCase()
      const summary = (log.summary || '').toLowerCase()
      const content = (log.worklogSummary || log.formattedJiraWorklog || '').toLowerCase()
      if (!tId.includes(q) && !summary.includes(q) && !content.includes(q)) {
        return false
      }
    }

    if (historyFilterDate) {
      const logDate = log.worklogDate || (log.createdAt ? log.createdAt.split('T')[0] : '')
      if (logDate !== historyFilterDate) {
        return false
      }
    }

    return true
  })

  const WORKLOG_DRAFT_KEY = 'jira_worklog_draft_state'

  useEffect(() => {
    loadJiraConfigAndWatchlist()
    loadSavedWorklogs()

    // Restore draft state across tab navigation
    try {
      const savedDraft = sessionStorage.getItem(WORKLOG_DRAFT_KEY)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed.ticketInput) setTicketInput(parsed.ticketInput)
        if (parsed.selectedTicketId) setSelectedTicketId(parsed.selectedTicketId)
        if (parsed.ticketDetails) setTicketDetails(parsed.ticketDetails)
        if (parsed.generatedWorklog) setGeneratedWorklog(parsed.generatedWorklog)
        if (parsed.editableSummary) setEditableSummary(parsed.editableSummary)
        if (parsed.editableJiraFormat) setEditableJiraFormat(parsed.editableJiraFormat)
        if (parsed.timeHours !== undefined) setTimeHours(parsed.timeHours)
        if (parsed.timeMinutes !== undefined) setTimeMinutes(parsed.timeMinutes)
        if (parsed.worklogDate) setWorklogDate(parsed.worklogDate)
        if (parsed.userNotes) setUserNotes(parsed.userNotes)
      }
    } catch { /* ignore */ }
  }, [])

  // Auto-save draft state on input changes
  useEffect(() => {
    if (ticketDetails || generatedWorklog || ticketInput) {
      try {
        sessionStorage.setItem(WORKLOG_DRAFT_KEY, JSON.stringify({
          selectedTicketId,
          ticketInput,
          ticketDetails,
          generatedWorklog,
          editableSummary,
          editableJiraFormat,
          timeHours,
          timeMinutes,
          worklogDate,
          userNotes,
        }))
      } catch { /* ignore */ }
    }
  }, [selectedTicketId, ticketInput, ticketDetails, generatedWorklog, editableSummary, editableJiraFormat, timeHours, timeMinutes, worklogDate, userNotes])

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
        timeSpent: getTimeSpentString(),
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

  // STEP 2 - BUTTON 2 HANDLER: Post Work Log on Jira (Direct Time Tracking API Post)
  const handlePostToJira = async () => {
    const formattedText = editableJiraFormat || editableSummary || generatedWorklog?.formattedJiraWorklog || ''
    if (!formattedText) {
      showToast('⚠️ Please click "Generate Work Description" first before posting to Jira.')
      return
    }

    const targetTicketId = ticketDetails?.ticketId || selectedTicketId || ticketInput
    const calcTimeSpent  = getTimeSpentString()

    try {
      showToast('🚀 Posting official Worklog to Jira Time Tracking...')
      
      // 1. Direct Jira REST API Worklog Post (Time spent, Date started, Work description ADF)
      const postRes = await postJiraWorklogDirect({
        ticketId: targetTicketId,
        timeSpent: calcTimeSpent,
        worklogDate,
        workDescription: formattedText,
      })

      const returnedJiraWorklogId = postRes?.jiraWorklogId || postRes?.result?.id || ''

      // 2. Auto-save work log to local database & refresh history
      try {
        const payload = {
          jiraTicketId: targetTicketId,
          jiraWorklogId: returnedJiraWorklogId,
          jiraBaseUrl: ticketDetails?.jiraBaseUrl || jiraBaseUrl,
          summary: ticketDetails?.summary || generatedWorklog?.summary,
          timeSpent: calcTimeSpent,
          worklogDate,
          worklogSummary: editableSummary || formattedText,
          bulletPoints: generatedWorklog?.bulletPoints || [],
          formattedJiraWorklog: editableJiraFormat || formattedText,
        }
        await saveJiraWorklog(payload)
        loadSavedWorklogs()
      } catch { /* ignore */ }

      // 3. Copy formatted comment to clipboard
      navigator.clipboard.writeText(formattedText)

      showToast(`🎉 Worklog successfully posted directly to Jira ticket ${targetTicketId}!`)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to post work log directly to Jira. Make sure Jira is connected in Settings.')
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
        timeSpent: getTimeSpentString(),
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

  const handleDeletePostedWorklog = async (log) => {
    const localId = log._id || log.id
    const targetTicketId = log.jiraTicketId
    const jiraWlId = log.jiraWorklogId

    const confirmMsg = jiraWlId
      ? `Are you sure you want to delete this posted work log entry from Jira ticket [${targetTicketId}] and local history?`
      : `Are you sure you want to remove this work log entry from local history?`
    
    if (!window.confirm(confirmMsg)) return

    try {
      // 1. If linked to Jira worklog ID, delete from Jira REST API Time Tracking
      if (jiraWlId && targetTicketId) {
        try {
          await deleteJiraWorklogDirectFromJira(targetTicketId, jiraWlId)
          showToast(`🗑 Work log entry deleted from Jira ticket ${targetTicketId}!`)
        } catch (err) {
          console.warn('[DeleteWorklogJira] Error deleting from Jira:', err.message)
        }
      }

      // 2. Delete local database entry
      await deleteJiraWorklog(localId)
      setSavedLogs(prev => prev.filter(l => (l._id || l.id) !== localId))
      showToast(`Removed entry [${targetTicketId}] from history.`)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete work log entry.')
    }
  }

  const handleDeleteLog = async (id) => {
    try {
      await deleteJiraWorklog(id)
      setSavedLogs(prev => prev.filter(l => (l._id || l.id) !== id))
      showToast('Removed from work log history.')
    } catch { /* ignore */ }
  }

  const handleDeleteJiraComment = async (commentId) => {
    const targetId = ticketDetails?.ticketId || selectedTicketId || ticketInput
    if (!targetId || !commentId) return
    const confirmDel = window.confirm(`Are you sure you want to delete this comment from Jira ticket [${targetId}]?`)
    if (!confirmDel) return

    try {
      await deleteJiraCommentOnJira(targetId, commentId)
      showToast(`🗑 Comment deleted from Jira ticket ${targetId}!`)
      // Refresh ticket details
      handleFetchTicket(targetId)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete comment from Jira.')
    }
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

            {/* Inputs Grid: Date, Hours, Minutes & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 0.8fr 1.3fr', gap: '1rem', marginBottom: '1.5rem' }}>
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
                  ⏱️ Hours (h)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={timeHours}
                  onChange={e => setTimeHours(e.target.value)}
                  placeholder="1"
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⏱️ Minutes (m)
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timeMinutes}
                  onChange={e => setTimeMinutes(e.target.value)}
                  placeholder="30"
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

            {/* HALF-AND-HALF 2-COLUMN GRID FOR COMMENTS & GENERATED WORK LOG */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              
              {/* LEFT HALF: COMMENTS POSTED BY YOU */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.75rem', padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      💬 Comments Posted by You ({jiraEmail || 'Connected Account'})
                    </span>
                    {ticketDetails.totalCommentsCount > (ticketDetails.userCommentsCount || ticketDetails.commentsList?.length || 0) && (
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        ({ticketDetails.totalCommentsCount - (ticketDetails.userCommentsCount || 0)} from others excluded)
                      </span>
                    )}
                  </div>

                  {ticketDetails.commentsList && ticketDetails.commentsList.length > 0 ? (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '0.6rem',
                      maxHeight: '260px', overflowY: 'auto', paddingRight: '0.25rem',
                    }}>
                      {ticketDetails.commentsList.map((c, idx) => (
                        <div key={idx} style={{
                          padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                          background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80' }}>
                              👤 {c.author} (You)
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {c.dateStr && (
                                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                  {c.dateStr}
                                </span>
                              )}
                              {(c.commentId || c.id) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteJiraComment(c.commentId || c.id)}
                                  title="Delete this comment from Jira"
                                  style={{
                                    padding: '0.15rem 0.45rem', borderRadius: '0.25rem', fontSize: '0.68rem',
                                    background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#f87171', cursor: 'pointer', fontWeight: 600,
                                  }}
                                >
                                  🗑 Delete from Jira
                                </button>
                              )}
                            </div>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                            {c.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '2.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
                      💬 No comments posted by your account on this ticket yet. AI will generate summary using ticket context.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT HALF: FORMATTED JIRA COMMENT (READY TO PASTE) */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '0.75rem', padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      💬 Formatted Jira Comment (Ready to Paste)
                    </span>

                    {generatedWorklog && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyClipboard(editableJiraFormat || editableSummary)}
                          style={{
                            padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.72rem', fontWeight: 700,
                            background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)',
                            color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                          }}
                        >
                          <span>📋 Copy</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveLog}
                          disabled={savingLog}
                          style={{
                            padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.72rem', fontWeight: 700,
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', border: 'none',
                            color: '#ffffff', cursor: savingLog ? 'not-allowed' : 'pointer', opacity: savingLog ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', gap: '0.25rem', boxShadow: '0 2px 10px rgba(34,197,94,0.3)',
                          }}
                        >
                          <span>{savingLog ? 'Saving...' : '💾 Save'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {generatedWorklog ? (
                    <textarea
                      rows={10}
                      value={editableJiraFormat || editableSummary}
                      onChange={e => {
                        setEditableJiraFormat(e.target.value)
                        setEditableSummary(e.target.value)
                      }}
                      style={{
                        width: '100%', padding: '0.85rem', borderRadius: '0.5rem',
                        background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#f8fafc', fontSize: '0.85rem', outline: 'none', lineHeight: 1.5,
                        resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace',
                      }}
                    />
                  ) : (
                    <div style={{ padding: '2.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>
                      ✨ Click <strong>"Generate Work Description from Comments"</strong> below to evaluate your comments and generate the formatted comment here.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* TWO ACTION BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
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
          </div>
        )}

        {/* SAVED WORK LOG HISTORY SECTION WITH FILTER CONTROLS */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '1rem', padding: '1.5rem', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📜 Saved Work Log History</span>
              <span style={{
                padding: '0.15rem 0.6rem', borderRadius: '9999px',
                background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                {filteredSavedLogs.length} {filteredSavedLogs.length !== savedLogs.length ? `(of ${savedLogs.length})` : ''}
              </span>
            </h2>

            {/* Filter Bar Controls */}
            {savedLogs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                {/* Search Input */}
                <input
                  type="text"
                  value={historyFilterSearch}
                  onChange={e => setHistoryFilterSearch(e.target.value)}
                  placeholder="🔍 Search Ticket ID / keyword..."
                  style={{
                    padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc', fontSize: '0.8rem', outline: 'none', minWidth: '180px',
                  }}
                />

                {/* Date Filter */}
                <input
                  type="date"
                  value={historyFilterDate}
                  onChange={e => setHistoryFilterDate(e.target.value)}
                  style={{
                    padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                    background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc', fontSize: '0.8rem', outline: 'none',
                  }}
                />

                {/* Clear Filters Button */}
                {(historyFilterSearch || historyFilterDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryFilterSearch('')
                      setHistoryFilterDate('')
                    }}
                    style={{
                      padding: '0.45rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.78rem',
                      background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171', cursor: 'pointer', fontWeight: 700,
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {savedLogs.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>No saved work logs yet</div>
              <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                Work logs that you generate and post will be automatically saved here for reference.
              </p>
            </div>
          ) : filteredSavedLogs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>No work logs matched your active filters</div>
              <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                Try searching for a different Ticket ID keyword or clearing the date filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredSavedLogs.map(log => {
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
                          onClick={() => handleCopyClipboard(log.formattedJiraWorklog || log.worklogSummary)}
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
                          onClick={() => handleDeletePostedWorklog(log)}
                          title={log.jiraWorklogId ? "Delete worklog from Jira & local history" : "Delete from local history"}
                          style={{
                            padding: '0.3rem 0.65rem', borderRadius: '0.375rem', fontSize: '0.75rem',
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', cursor: 'pointer', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                          }}
                        >
                          <span>🗑 {log.jiraWorklogId ? 'Delete from Jira' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '0.8rem', color: '#cbd5e1', margin: 0,
                      lineHeight: 1.5, background: 'rgba(0,0,0,0.2)',
                      padding: '0.75rem 0.85rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap',
                    }}>
                      {log.formattedJiraWorklog || log.worklogSummary}
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
