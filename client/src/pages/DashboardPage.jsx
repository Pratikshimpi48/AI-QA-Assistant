import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats, getNotifications } from '../services/api'
import { getGuestStats } from '../utils/guestSession'
import Navbar from '../components/Navbar'

const S = {
  page:     { background: 'var(--color-bg)', minHeight: '100vh' },
  wrap:     { maxWidth: 1100, margin: '0 auto', padding: '7.5rem 1.5rem 4rem' },
  profileBox: {
    borderRadius: '1.25rem', padding: '2rem',
    background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)',
    border: '1px solid var(--color-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem',
  },
  avatar: {
    width: 64, height: 64, borderRadius: '1.25rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.5rem', fontWeight: 800, color: '#ffffff',
    boxShadow: '0 0 20px rgba(99,102,241,0.4)', flexShrink: 0,
  },
  heading: { fontSize: 'clamp(1.75rem,4vw,2.25rem)', fontWeight: 800, color: 'var(--color-text)', margin: 0 },
  sub:     { fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' },
  card:    {
    borderRadius: '1rem', padding: '1.5rem',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  },
  cardNum: {
    fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.25rem',
    background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  sectionTitle: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalTestRuns: 0,
    totalTestCases: 0,
    totalBugReports: 0,
    hoursSaved: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    async function loadStats() {
      if (!isAuthenticated) {
        const guestData = getGuestStats()
        setStats({
          totalTestRuns:   guestData?.totalTestRuns || 0,
          totalTestCases:  guestData?.totalTestCases || 0,
          totalBugReports: guestData?.totalBugReports || 0,
          hoursSaved:      guestData?.hoursSaved || 0,
          recentActivity:  Array.isArray(guestData?.recentActivity) ? guestData.recentActivity : [],
        })
        setLoading(false)
        return
      }
      try {
        const res = await getDashboardStats()
        if (res && res.stats) {
          setStats({
            totalTestRuns:   res.stats.totalTestRuns || 0,
            totalTestCases:  res.stats.totalTestCases || 0,
            totalBugReports: res.stats.totalBugReports || 0,
            hoursSaved:      res.stats.hoursSaved || 0,
            recentActivity:  Array.isArray(res.stats.recentActivity) ? res.stats.recentActivity : [],
          })
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    getNotifications()
      .then(res => setNotifications((res.notifications || []).filter(n => !n.read).slice(0, 3)))
      .catch(() => {})
  }, [isAuthenticated])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (d) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const statCards = [
    { id: 'stat-runs',    label: 'Total Test Runs',      value: stats.totalTestRuns },
    { id: 'stat-cases',   label: 'Generated Test Cases', value: stats.totalTestCases },
    { id: 'stat-bugs',    label: 'Generated Bug Reports', value: stats.totalBugReports },
    { id: 'stat-saved',   label: 'Hours Saved Est.',     value: `${stats.hoursSaved}h` },
  ]

  const featureCards = [
    {
      icon: '🧪',
      title: 'AI Test Case Generator',
      desc: 'Generate comprehensive positive, negative, edge case, and security test suites automatically from text or uploaded documents.',
      badge: 'Core Feature',
      color: '#818cf8',
      link: '/',
    },
    {
      icon: '🐛',
      title: 'AI Bug Report Generator',
      desc: 'Transform raw console error logs or issue descriptions into structured Jira and GitHub-ready bug tickets.',
      badge: 'Instant Format',
      color: '#f87171',
      link: '/bug-report',
    },
    {
      icon: '📁',
      title: 'Document & Spec Parser',
      desc: 'Upload software specifications (.txt, .pdf, .docx, .md) to extract key requirements and auto-generate test coverage.',
      badge: 'Multi-Format',
      color: '#22d3ee',
      link: '/',
    },
    {
      icon: '📊',
      title: 'Test History & Analytics',
      desc: 'Access your private history of test suites and bug reports, track productivity gains, and export to CSV or Markdown.',
      badge: 'User Isolated',
      color: '#a78bfa',
      link: '/history',
    },
  ]

  const quickTemplates = [
    {
      title: '🔐 User Auth & JWT Specification',
      type: 'test-cases',
      text: 'Users must be able to register with email, password, full name, and DOB. Password must be hashed. Login returns a JWT token. Invalid login returns 401. Token expires in 7 days.',
    },
    {
      title: '💳 E-Commerce Payment Gateway',
      type: 'test-cases',
      text: 'Checkout accepts credit card payment via Stripe. Validates card number, expiry, CVV. Handles payment failure, insufficient funds, and network timeout gracefully.',
    },
    {
      title: '🚨 API Server 500 Error Log',
      type: 'bug-report',
      text: 'POST /api/checkout returned status 500 Internal Server Error. Stack trace: TypeError: Cannot read property "amount" of undefined at processPayment (payment.js:42).',
    },
  ]

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.wrap}>
        {/* ── User Banner ─────────────────── */}
        <div style={S.profileBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={S.avatar}>
              {isAuthenticated ? getInitials(user?.name) : '⚡'}
            </div>
            <div>
              <h1 style={S.heading}>
                {isAuthenticated ? `Welcome, ${user?.name || 'QA Engineer'}!` : 'AI QA Assistant Dashboard'}
              </h1>
              <p style={S.sub}>
                {isAuthenticated
                  ? `${user?.email} • Date of Birth: ${formatDate(user?.dob)}`
                  : 'Empower your software testing with AI-driven test case & bug report generation.'}
              </p>
            </div>
          </div>

          <div>
            {isAuthenticated ? (
              <button
                onClick={logout}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '0.625rem',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Sign Out
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  to="/login"
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '0.625rem',
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                    color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '0.625rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Guest Session Active Banner ─────────────────── */}
        {!isAuthenticated && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '0.875rem', marginBottom: '2.5rem',
            background: 'linear-gradient(135deg, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0.04) 100%)',
            border: '1px solid rgba(234,179,8,0.3)', color: '#facc15',
            fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <div>
                <strong>Guest Session Active:</strong> Data is temporarily saved in this tab. Log in or create an account to save your work permanently before closing the window.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/register" style={{ color: '#0f172a', background: '#facc15', padding: '0.35rem 0.85rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.775rem', textDecoration: 'none' }}>
                Save Permanently
              </Link>
            </div>
          </div>
        )}

        {/* ── Activity Statistics (Logged-in or Preview) ──────────────── */}
        <h2 style={S.sectionTitle}>📊 {isAuthenticated ? 'Your Activity Statistics' : 'QA Metrics & Productivity'}</h2>
        <div style={S.grid}>
          {statCards.map((s) => (
            <div key={s.id} id={s.id} style={S.card}>
              <div style={S.cardNum}>{s.value}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0, fontWeight: 500 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Platform Features Showcase (All Features Provided) ──────────────── */}
        <h2 style={S.sectionTitle}>✨ Application Capabilities & Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {featureCards.map((feat, idx) => (
            <Link key={idx} to={feat.link} style={{ textDecoration: 'none' }}>
              <div style={{
                ...S.card,
                height: '100%', boxSizing: 'border-box',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>{feat.icon}</span>
                    <span style={{
                      padding: '0.25rem 0.6rem', borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: feat.color, fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {feat.badge}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.4rem', color: 'var(--color-text)', fontSize: '1.05rem', fontWeight: 700 }}>
                    {feat.title}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {feat.desc}
                  </p>
                </div>
                <div style={{ marginTop: '1.25rem', color: feat.color, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Explore Feature →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Quick-Start Sample Templates ──────────────── */}
        <h2 style={S.sectionTitle}>🚀 Quick-Start Requirement Templates</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', marginTop: '-0.5rem' }}>
          Click any sample specification below to test out the AI generation features immediately.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {quickTemplates.map((tmpl, idx) => (
            <div key={idx} style={{
              ...S.card,
              background: 'rgba(255,255,255,0.02)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 700 }}>
                  {tmpl.title}
                </h4>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.825rem', lineHeight: 1.5 }}>
                  "{tmpl.text}"
                </p>
              </div>
              <button
                onClick={() => {
                  if (tmpl.type === 'bug-report') {
                    navigate('/bug-report')
                  } else {
                    navigate('/')
                  }
                }}
                style={{
                  marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Use Template →
              </button>
            </div>
          ))}
        </div>

        {/* ── Recent Activity / Getting Started ──────────────── */}
        <h2 style={S.sectionTitle}>🕒 {isAuthenticated ? 'Recent Activity Feed' : 'Getting Started Guide'}</h2>
        <div style={S.card}>
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: '2rem 0' }}>
              Loading dashboard data...
            </p>
          ) : (Array.isArray(stats?.recentActivity) && stats.recentActivity.length > 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {stats.recentActivity.map((act) => (
                <div
                  key={act.id || act._id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {act.type === 'bug-report' ? '🐛' : '🧪'}
                    </span>
                    <div>
                      <div style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '0.9rem' }}>
                        {act.title}
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        {act.type === 'bug-report' ? 'Bug Report' : `Test Suite (${Array.isArray(act.data) ? act.data.length : 0} Cases)`} • {formatDate(act.createdAt)}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/history"
                    style={{
                      color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                      padding: '0.35rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(99,102,241,0.1)',
                    }}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <p style={{ color: '#818cf8', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.25rem' }}>
                  🎯 Welcome to AI QA Assistant!
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Follow these 3 simple steps to generate test cases and bug reports:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#818cf8', marginBottom: '0.25rem' }}>1. Paste Specs</div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    Enter requirements or drag-and-drop specification files (.pdf, .docx, .txt).
                  </p>
                </div>

                <div style={{ padding: '1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#06b6d4', marginBottom: '0.25rem' }}>2. Generate AI Cases</div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    Click "Generate Test Cases" or "Generate Bug Report" using Gemini or Groq models.
                  </p>
                </div>

                <div style={{ padding: '1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80', marginBottom: '0.25rem' }}>3. Export & Track</div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    Export your test cases to CSV, copy Jira bug tickets, and review your private history.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Notifications Section */}
          {isAuthenticated && notifications.length > 0 && (
            <div style={{ ...S.card, marginTop: '2rem', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ ...S.sectionTitle, marginBottom: 0 }}>
                  🔔 Recent Notifications
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '9999px',
                    background: 'rgba(239,68,68,0.2)', color: '#f87171',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>{notifications.length} unread</span>
                </h2>
                <Link to="/notifications" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                  View All →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {notifications.map(notif => (
                  <Link
                    key={notif._id || notif.id}
                    to="/notifications"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                      padding: '0.875rem 1rem', borderRadius: '0.75rem',
                      background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)',
                      borderLeft: '3px solid #6366f1', textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.05rem' }}>✅</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.title}
                      </p>
                      {notif.jiraTicketId && (
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#6366f1' }}>🎫 {notif.jiraTicketId}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
