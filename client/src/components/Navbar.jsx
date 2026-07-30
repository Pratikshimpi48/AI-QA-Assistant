import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

const NAV_LINKS = [
  {
    id:   'nav-dashboard',
    to:   '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id:   'nav-test-generator',
    to:   '/',
    label: 'Test Case Generator',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id:   'nav-bug-report',
    to:   '/bug-report',
    label: 'Bug Generator',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6l4-4 4 4" /><path d="M12 2v8" />
        <path d="M20 13v1a8 8 0 01-16 0v-1" />
        <path d="M4 10h16" />
      </svg>
    ),
  },
  {
    id:   'nav-history',
    to:   '/history',
    label: 'History',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id:   'nav-jira-watchlist',
    to:   '/jira-watchlist',
    label: 'Jira Watchlist',
    authOnly: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
        <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
      </svg>
    ),
  },
  {
    id:   'nav-templates',
    to:   '/templates',
    label: 'Templates',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id:   'nav-user-admin',
    to:   '/admin/users',
    label: 'User Admin',
    adminOnly: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id:   'nav-settings',
    to:   '/settings',
    label: 'Settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headerStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(10, 13, 20, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    transition: 'all 0.3s ease',
    boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.6)' : 'none',
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <header style={headerStyle}>
      <nav
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: '0 2rem',
          height: '4.25rem',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* Far Left: Logo & Brand Name */}
        <Link to="/" id="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: '0.65rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              boxShadow: '0 0 18px rgba(99,102,241,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <span style={{
              fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #ffffff 0%, #c7d2fe 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'block', lineHeight: 1.1, whiteSpace: 'nowrap',
            }}>
              AI QA Assistant
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginTop: 2, whiteSpace: 'nowrap' }}>
              Powered by Gemini & Groq
            </span>
          </div>
        </Link>

        {/* Center: Spacious Desktop Nav Links */}
        <div id="nav-desktop-links" className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0 auto' }}>
          {NAV_LINKS.filter(link => (!link.authOnly || isAuthenticated) && (!link.adminOnly || user?.role === 'admin')).map((link) => (
            <NavLink
              key={link.id}
              id={link.id}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.5rem 0.85rem', borderRadius: '0.6rem',
                fontSize: '0.825rem', fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                color: isActive ? '#818cf8' : '#94a3b8',
                background: isActive ? 'rgba(99,102,241,0.14)' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              })}
            >
              <span style={{ opacity: 0.85, flexShrink: 0 }}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Far Right: User Profile & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <NotificationBell />

              {/* User Avatar Pill */}
              <Link to="/profile" title="View Profile & Settings" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.35rem 0.85rem 0.35rem 0.4rem', borderRadius: '9999px',
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                  color: '#ffffff', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800, color: '#fff',
                    boxShadow: '0 0 10px rgba(99,102,241,0.4)',
                  }}>
                    {getInitials(user?.name)}
                  </div>
                  <span>{user?.name?.split(' ')[0]}</span>
                </div>
              </Link>

              {/* Sleek Log Out Button */}
              <button
                id="nav-logout-btn"
                onClick={logout}
                title="Log Out"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.5rem',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  padding: '0.45rem 0.95rem', borderRadius: '0.5rem',
                  color: '#c7d2fe', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                  border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)',
                  whiteSpace: 'nowrap',
                }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: '0.45rem 0.95rem', borderRadius: '0.5rem',
                  color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                Register
              </Link>
            </div>
          )}

          {/* Hamburger Menu for Mobile */}
          <button
            id="nav-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            className="nav-hamburger"
            style={{
              display: 'none', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div
        id="nav-mobile-menu"
        style={{
          overflow: 'hidden',
          maxHeight: menuOpen ? '400px' : '0px',
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          background: 'rgba(10,13,20,0.97)',
        }}
      >
        <div style={{ padding: '0.75rem 1rem 1rem' }}>
          {NAV_LINKS.filter(link => (!link.authOnly || isAuthenticated) && (!link.adminOnly || user?.role === 'admin')).map((link) => (
            <NavLink
              key={`mobile-${link.id}`}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '0.625rem',
                marginBottom: '0.25rem',
                fontSize: '0.9rem', fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                color: isActive ? '#818cf8' : '#94a3b8',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              })}
            >
              <span style={{ opacity: 0.8 }}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
