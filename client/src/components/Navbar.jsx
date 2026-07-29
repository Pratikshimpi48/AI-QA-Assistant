import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <nav style={{
        width: '100%', maxWidth: '1100px', margin: '0 auto',
        padding: '0 1.5rem', height: '4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>
        {/* Logo + Brand */}
        <Link
          to="/"
          id="nav-logo"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              boxShadow: '0 0 16px rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #f1f5f9 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI QA Assistant
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a
            href="#how-it-works"
            id="nav-how-it-works"
            style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.target.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.target.style.color = 'var(--color-text-muted)')}
          >
            How it works
          </a>
          <a
            href="#generate"
            id="nav-get-started"
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem',
              fontSize: '0.875rem', fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#fff', textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Get Started
          </a>
        </div>
      </nav>
    </header>
  )
}
