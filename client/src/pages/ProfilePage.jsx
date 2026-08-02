import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getAdminUsers, updateUserRole } from '../services/api'

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatISOForInput(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, updateProfile, updatePassword } = useAuth()
  const navigate = useNavigate()

  // Profile Edit State
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [dob, setDob]       = useState('')
  const [profileSaving, setProfileSaving]   = useState(false)
  const [profileMsg, setProfileMsg]         = useState({ text: '', type: '' })

  // Password Change State
  const [currentPassword, setCurrentPassword]       = useState('')
  const [newPassword, setNewPassword]               = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passSaving, setPassSaving]                 = useState(false)
  const [passMsg, setPassMsg]                       = useState({ text: '', type: '' })

  // Admin User Role Access State
  const [adminUsers, setAdminUsers]                 = useState([])
  const [adminLoading, setAdminLoading]             = useState(false)
  const [adminMsg, setAdminMsg]                     = useState({ text: '', type: '' })
  const [updatingUserId, setUpdatingUserId]         = useState(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
      return
    }
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setDob(formatISOForInput(user.dob))

      if (user.role === 'admin') {
        setAdminLoading(true)
        getAdminUsers()
          .then(res => setAdminUsers(res.users || []))
          .catch(err => setAdminMsg({ text: err.message, type: 'error' }))
          .finally(() => setAdminLoading(false))
      }
    }
  }, [user, isAuthenticated, authLoading, navigate])

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin'
    const targetId = targetUser.id || targetUser._id
    setUpdatingUserId(targetId)
    setAdminMsg({ text: '', type: '' })

    try {
      const res = await updateUserRole(targetId, newRole)
      setAdminMsg({ text: `✅ ${res.message || 'User role updated successfully!'}`, type: 'success' })
      setAdminUsers(prev => prev.map(u => (u.id === targetId || u._id === targetId) ? { ...u, role: newRole } : u))
      setTimeout(() => setAdminMsg({ text: '', type: '' }), 4000)
    } catch (err) {
      setAdminMsg({ text: `❌ ${err.message}`, type: 'error' })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileMsg({ text: '', type: '' })

    if (!name.trim() || !email.trim() || !dob) {
      setProfileMsg({ text: 'Please fill out all profile fields.', type: 'error' })
      return
    }

    setProfileSaving(true)
    try {
      const res = await updateProfile({ name: name.trim(), email: email.trim(), dob })
      setProfileMsg({ text: `✅ ${res.message || 'Profile updated successfully!'}`, type: 'success' })
      setTimeout(() => setProfileMsg({ text: '', type: '' }), 5000)
    } catch (err) {
      setProfileMsg({ text: `❌ ${err.message}`, type: 'error' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPassMsg({ text: '', type: '' })

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPassMsg({ text: 'Please fill out all password fields.', type: 'error' })
      return
    }

    if (newPassword.length < 6) {
      setPassMsg({ text: 'New password must be at least 6 characters long.', type: 'error' })
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPassMsg({ text: 'New password and confirm password do not match.', type: 'error' })
      return
    }

    setPassSaving(true)
    try {
      const res = await updatePassword({ currentPassword, newPassword, confirmNewPassword })
      setPassMsg({ text: `✅ ${res.message || 'Password changed successfully!'}`, type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPassMsg({ text: '', type: '' }), 5000)
    } catch (err) {
      setPassMsg({ text: `❌ ${err.message}`, type: 'error' })
    } finally {
      setPassSaving(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1',
            animation: 'spin-slow 0.8s linear infinite',
          }} />
        </div>
      </div>
    )
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'QA'

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '8rem 1.5rem 4rem' }}>

        {/* Page Title */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.375rem 1rem', borderRadius: '9999px',
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
          color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
        }}>
          👤 Account & Security
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          User Profile Management
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Manage your personal account details, update registration info, and maintain account credentials securely.
        </p>

        {/* User Card Header */}
        <div style={{
          padding: '2rem', borderRadius: '1.25rem', marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: '#ffffff',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)', flexShrink: 0,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {user.name}
              </h2>
              <span style={{
                padding: '0.2rem 0.65rem', borderRadius: '9999px',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)',
                color: '#4ade80', fontSize: '0.72rem', fontWeight: 700,
              }}>
                ● Active Account
              </span>
            </div>

            <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {user.email}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              <span>🎂 DOB: <strong style={{ color: 'var(--color-text)' }}>{formatDate(user.dob)}</strong></span>
              <span>📅 Joined: <strong style={{ color: 'var(--color-text)' }}>{formatDate(user.createdAt)}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>

          {/* Section 1: Edit Profile Details */}
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '1.25rem', padding: '1.75rem', display: 'flex', flexDirection: 'column',
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✏️ Personal Details
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.82rem', color: '#64748b' }}>
              Update your name, email address, and date of birth.
            </p>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              <div>
                <label htmlFor="profile-name-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Full Name
                </label>
                <input
                  id="profile-name-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="profile-email-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Email Address
                </label>
                <input
                  id="profile-email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="profile-dob-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Date of Birth
                </label>
                <input
                  id="profile-dob-input"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              {profileMsg.text && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  background: profileMsg.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                  border: profileMsg.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
                  color: profileMsg.type === 'error' ? '#f87171' : '#4ade80',
                  fontSize: '0.82rem',
                }}>
                  {profileMsg.text}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={profileSaving}
                  style={{
                    width: '100%', padding: '0.75rem 1.25rem', borderRadius: '0.5rem',
                    fontSize: '0.875rem', fontWeight: 700,
                    background: profileSaving ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#fff', border: 'none', cursor: profileSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)', transition: 'all 0.2s',
                  }}
                >
                  {profileSaving ? 'Saving Changes...' : '💾 Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Change Password */}
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '1.25rem', padding: '1.75rem', display: 'flex', flexDirection: 'column',
          }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔒 Change Password
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.82rem', color: '#64748b' }}>
              Update your account password. Must be at least 6 characters.
            </p>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              <div>
                <label htmlFor="current-password-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Current Password
                </label>
                <input
                  id="current-password-input"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="new-password-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <input
                  id="new-password-input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="confirm-new-password-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <input
                  id="confirm-new-password-input"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              {passMsg.text && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  background: passMsg.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                  border: passMsg.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
                  color: passMsg.type === 'error' ? '#f87171' : '#4ade80',
                  fontSize: '0.82rem',
                }}>
                  {passMsg.text}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button
                  id="change-password-btn"
                  type="submit"
                  disabled={passSaving}
                  style={{
                    width: '100%', padding: '0.75rem 1.25rem', borderRadius: '0.5rem',
                    fontSize: '0.875rem', fontWeight: 700,
                    background: passSaving ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                    color: '#fff', border: 'none', cursor: passSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(6,182,212,0.35)', transition: 'all 0.2s',
                  }}
                >
                  {passSaving ? 'Updating Password...' : '🔑 Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* 👑 Administrator Panel: Organization User Role Access */}
        {user?.role === 'admin' && (
          <div style={{
            marginTop: '2.5rem', borderRadius: '1rem', padding: '2rem',
            background: 'var(--color-surface)', border: '1px solid rgba(234,179,8,0.3)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>👑</span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    Administrator Panel: Organization User Access
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Manage registered organization accounts and grant/revoke Admin authority.
                </p>
              </div>

              <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.35)',
                color: '#eab308', fontSize: '0.775rem', fontWeight: 700,
              }}>
                ⭐ Admin Authority Active
              </span>
            </div>

            {adminMsg.text && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                background: adminMsg.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                border: adminMsg.type === 'error' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)',
                color: adminMsg.type === 'error' ? '#f87171' : '#4ade80',
                fontSize: '0.85rem', fontWeight: 600,
              }}>
                {adminMsg.text}
              </div>
            )}

            {adminLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                Loading registered user accounts...
              </div>
            ) : adminUsers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No other registered users found in database store.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>User</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Joined</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u, i) => {
                      const uId = u.id || u._id
                      const isAdmin = u.role === 'admin'
                      const isSelf = u.email === user.email

                      return (
                        <tr key={uId || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#ffffff' }}>
                            {u.name} {isSelf ? ' (You)' : ''}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                              background: isAdmin ? 'rgba(234,179,8,0.15)' : 'rgba(148,163,184,0.15)',
                              border: isAdmin ? '1px solid rgba(234,179,8,0.35)' : '1px solid rgba(148,163,184,0.3)',
                              color: isAdmin ? '#eab308' : '#94a3b8',
                            }}>
                              {isAdmin ? '👑 Admin' : '👤 User'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                            {formatDate(u.createdAt)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleRoleToggle(u)}
                              disabled={updatingUserId === uId}
                              style={{
                                padding: '0.35rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.775rem', fontWeight: 700,
                                background: isAdmin ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.15)',
                                border: isAdmin ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(234,179,8,0.35)',
                                color: isAdmin ? '#f87171' : '#eab308',
                                cursor: updatingUserId === uId ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {updatingUserId === uId ? 'Updating...' : isAdmin ? 'Revoke Admin' : 'Grant Admin 👑'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
