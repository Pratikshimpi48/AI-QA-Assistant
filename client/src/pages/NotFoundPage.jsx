import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function NotFoundPage() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', textAlign: 'center', padding: '0 1.5rem',
      }}>
        <div style={{
          fontSize: 'clamp(5rem,20vw,9rem)', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(6,182,212,0.4) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '1.5rem',
        }}>
          404
        </div>
        <h1 id="not-found-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '2rem', maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          id="not-found-home-link"
          to="/"
          style={{
            padding: '0.75rem 1.75rem', borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
          }}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
