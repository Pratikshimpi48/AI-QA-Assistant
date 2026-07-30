import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getAdminUsers, updateUserRole } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function UserManagementPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminUsers()
      setUsers(res.users || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Access denied. Administrator privileges required.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (targetUserId, targetEmail, newRole) => {
    setError('')
    setSuccess('')
    try {
      const res = await updateUserRole(targetUserId, newRole)
      setSuccess(`Updated role for ${targetEmail} to "${res.user?.role || newRole}".`)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.')
    }
  }

  const formatDate = (d) => {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text)' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '7.5rem 1.5rem 4rem' }}>
        
        {/* Header Title Banner */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.25rem' }}>👑</span>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                User Access & Role Management
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
                Administrator portal to manage team member access, grant Admin authority, and configure permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '0.85rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80',
            fontSize: '0.875rem', fontWeight: 600,
          }}>
            ✅ {success}
          </div>
        )}

        {/* Users Table Card */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
              Registered Organization Accounts ({users.length})
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, background: 'rgba(99,102,241,0.1)', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}>
              Logged in as Admin: {user?.email}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Loading registered users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No registered users found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: '#94a3b8', fontSize: '0.775rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>User / Engineer</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date of Birth</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Joined Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Role Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Admin Role Control</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isOwner = u.email && u.email.toLowerCase().trim() === 'pratikshimpi48@gmail.com'
                    const isAdmin = u.role === 'admin' || isOwner

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: isAdmin ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' : 'rgba(255,255,255,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                            }}>
                              {(u.name || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <span>{u.name || 'QA User'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '1rem', color: '#c7d2fe', fontFamily: 'monospace' }}>
                          {u.email}
                        </td>

                        <td style={{ padding: '1rem', color: '#94a3b8' }}>
                          {formatDate(u.dob)}
                        </td>

                        <td style={{ padding: '1rem', color: '#94a3b8' }}>
                          {formatDate(u.createdAt)}
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                            background: isAdmin ? 'rgba(99,102,241,0.18)' : 'rgba(100,116,139,0.15)',
                            border: isAdmin ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(100,116,139,0.3)',
                            color: isAdmin ? '#818cf8' : '#94a3b8',
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          }}>
                            {isAdmin ? '👑 Administrator' : '👤 Standard User'}
                          </span>
                        </td>

                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {isOwner ? (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                              Primary Super Admin
                            </span>
                          ) : (
                            <select
                              value={u.role || 'user'}
                              onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                              style={{
                                padding: '0.35rem 0.65rem', borderRadius: '0.5rem',
                                background: 'rgba(15,23,42,0.9)', border: '1px solid var(--color-border)',
                                color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              <option value="user">👤 User</option>
                              <option value="admin">👑 Admin</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
