import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
  })

  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate     = useNavigate()

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const { name, email, password, confirmPassword, dob } = formData

    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.')
      return
    }

    if (!dob) {
      setError('Please select your Date of Birth.')
      return
    }

    try {
      setLoading(true)
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        dob,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        padding: '7rem 1.5rem 4rem',
        boxSizing: 'border-box',
      }}>
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '1.25rem',
          padding: '2.5rem 2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '1rem',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', boxShadow: '0 0 20px rgba(6,182,212,0.4)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
              Create Account
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Join AI QA Assistant to organize your testing history
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '0.625rem',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Pratik Shimpi"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Date of Birth */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Date of Birth
              </label>
              <input
                id="register-dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box', colorScheme: 'dark',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Password (min 6 chars)
              </label>
              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Confirm Password
              </label>
              <input
                id="register-confirm-password"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem', borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
                color: '#ffffff', fontSize: '0.95rem', fontWeight: 700,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(6,182,212,0.4)',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              }}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: '#22d3ee', fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
