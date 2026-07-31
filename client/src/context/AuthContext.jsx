import { createContext, useContext, useState, useEffect } from 'react'
import {
  registerUser as apiRegister,
  loginUser as apiLogin,
  getCurrentUser,
  updateUserProfile as apiUpdateProfile,
  updateUserPassword as apiUpdatePassword,
  syncGuestHistory,
  syncGuestWatchlist,
} from '../services/api'
import { getGuestHistory, clearGuestSession } from '../utils/guestSession'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]           = useState(() => localStorage.getItem('ai_qa_token') || null)
  const [user, setUser]             = useState(() => {
    const saved = localStorage.getItem('ai_qa_user')
    try { return saved ? JSON.parse(saved) : null } catch { return null }
  })
  const [loading, setLoading]       = useState(true)

  const syncGuestData = async () => {
    try {
      const guestItems = getGuestHistory()
      if (Array.isArray(guestItems) && guestItems.length > 0) {
        await syncGuestHistory(guestItems)
        clearGuestSession()
      }
      await syncGuestWatchlist()
    } catch (err) {
      console.warn('Failed to sync guest data on auth:', err.message)
    }
  }

  // Validate stored token on startup
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const data = await getCurrentUser()
        setUser(data.user)
        localStorage.setItem('ai_qa_user', JSON.stringify(data.user))
        await syncGuestData()
      } catch (err) {
        console.warn('Session verification failed:', err.message)
        logout()
      } finally {
        setLoading(false)
      }
    }

    verifyAuth()
  }, [token])

  const register = async (formData) => {
    const data = await apiRegister(formData)
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('ai_qa_token', data.token)
    localStorage.setItem('ai_qa_user', JSON.stringify(data.user))
    await syncGuestData()
    return data
  }

  const login = async (credentials) => {
    const data = await apiLogin(credentials)
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('ai_qa_token', data.token)
    localStorage.setItem('ai_qa_user', JSON.stringify(data.user))
    await syncGuestData()
    return data
  }

  const updateProfile = async (formData) => {
    const data = await apiUpdateProfile(formData)
    setUser(data.user)
    localStorage.setItem('ai_qa_user', JSON.stringify(data.user))
    return data
  }

  const updatePassword = async (passData) => {
    const data = await apiUpdatePassword(passData)
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('ai_qa_token')
    localStorage.removeItem('ai_qa_user')
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    register,
    login,
    updateProfile,
    updatePassword,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
