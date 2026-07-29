import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

/* ── Nav link definitions ────────────────────────────────── */
const NAV_LINKS = [
  {
    id:   'nav-dashboard',
    to:   '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id:   'nav-bug-report',
    to:   '/bug-report',
    label: 'Bug Report Generator',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6l4-4 4 4" /><path d="M12 2v8" />
        <path d="M20 13v1a8 8 0 01-16 0v-1" />
        <path d="M4 10h16" /><path d="M4 17H2" /><path d="M22 17h-2" />
        <path d="M4 13H2" /><path d="M22 13h-2" />
      </svg>
    ),
  },
  {
    id:   'nav-history',
    to:   '/history',
    label: 'History',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id:   'nav-settings',
    to:   '/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [scrolled,   setScrolled]   = useState(false)
  const location = useLocation()

  /* Close mobile menu on route change */
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  /* Track scroll for elevated shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headerStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(10, 13, 20, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    transition: 'box-shadow 0.3s',
    boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.55)' : 'none',
  }

  return (
    <header style={headerStyle}>
      <nav
        style={{
          width: '100%', maxWidth: '1200px', margin: '0 auto',
          padding: '0 1.5rem', height: '4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Logo ──────────────────────────────────── */}
        <Link
          to="/"
          id="nav-logo"
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0 }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              boxShadow: '0 0 16px rgba(99,102,241,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform   = 'scale(1.1) rotate(-4deg)'
              e.currentTarget.style.boxShadow   = '0 0 28px rgba(99,102,241,0.7)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform   = 'scale(1) rotate(0deg)'
              e.currentTarget.style.boxShadow   = '0 0 16px rgba(99,102,241,0.45)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <span style={{
              fontSize: '0.975rem', fontWeight: 700, letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #f1f5f9 0%, #c7d2fe 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'block', lineHeight: 1.1,
            }}>
              AI QA Assistant
            </span>
            <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.05em', fontWeight: 500 }}>
              Powered by Gemini
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav Links ─────────────────────── */}
        <div
          id="nav-desktop-links"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            '@media(max-width:768px)': { display: 'none' },
          }}
          className="nav-desktop"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.id}
              id={link.id}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                display:      'flex',
                alignItems:   'center',
                gap:          '0.4rem',
                padding:      '0.45rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize:     '0.8rem',
                fontWeight:   isActive ? 600 : 500,
                textDecoration: 'none',
                color:          isActive ? '#818cf8' : '#94a3b8',
                background:     isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                border:         isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                transition:     'all 0.18s',
                whiteSpace:     'nowrap',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.classList.contains('active-link')) {
                  e.currentTarget.style.color      = '#cbd5e1'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  e.currentTarget.style.color      = '#94a3b8'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ opacity: 0.8, flexShrink: 0 }}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* ── Mobile Hamburger ─────────────────────── */}
        <button
          id="nav-hamburger"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="nav-hamburger"
          style={{
            display: 'none',           /* shown via CSS media query below */
            alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* ── Mobile Dropdown Menu ──────────────────── */}
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
          {NAV_LINKS.map((link) => (
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
                color:      isActive ? '#818cf8' : '#94a3b8',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                border:     isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                transition: 'all 0.18s',
              })}
            >
              <span style={{ opacity: 0.8 }}>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* ── Responsive CSS ───────────────────────── */}
      <style>{`
        @media (max-width: 860px) {
          .nav-desktop  { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
