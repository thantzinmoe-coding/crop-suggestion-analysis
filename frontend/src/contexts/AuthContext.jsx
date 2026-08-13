import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../api.js'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check local storage for an active session on load
    const session = localStorage.getItem('agroguard_session')
    if (session) {
      setCurrentUser(JSON.parse(session))
    }
    setLoading(false)
  }, [])

  const authenticate = async (path, email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = data.detail
      const message = Array.isArray(detail)
        ? detail.map(item => item?.msg || item?.message || JSON.stringify(item)).join(', ')
        : detail && typeof detail === 'object'
          ? (detail.message || JSON.stringify(detail))
          : detail
      const error = new Error(message || 'Authentication failed.')
      error.status = response.status
      error.detail = detail
      throw error
    }
    const sessionData = { ...data.user, token: data.token, emailSent: data.email_sent }
    localStorage.setItem('agroguard_session', JSON.stringify(sessionData))
    setCurrentUser(sessionData)
    return data
  }

  const register = (email, password) => authenticate('register', email, password)
  const login = (email, password) => authenticate('login', email, password)

  const logout = () => {
    localStorage.removeItem('agroguard_session')
    setCurrentUser(null)
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
