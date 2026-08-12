import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check local storage for an active session on load
    const session = localStorage.getItem('crop_ai_session')
    if (session) {
      setCurrentUser(JSON.parse(session))
    }
    setLoading(false)
  }, [])

  const register = (email, password) => {
    // Get existing users or empty array
    const usersStr = localStorage.getItem('crop_ai_demo_users')
    const users = usersStr ? JSON.parse(usersStr) : []

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists with this email.')
    }

    // Save new user
    const newUser = { email, password }
    users.push(newUser)
    localStorage.setItem('crop_ai_demo_users', JSON.stringify(users))

    // Log them in immediately
    const sessionData = { email }
    localStorage.setItem('crop_ai_session', JSON.stringify(sessionData))
    setCurrentUser(sessionData)
    
    return true
  }

  const login = (email, password) => {
    const usersStr = localStorage.getItem('crop_ai_demo_users')
    const users = usersStr ? JSON.parse(usersStr) : []

    const user = users.find(u => u.email === email && u.password === password)
    if (!user) {
      throw new Error('Invalid email or password.')
    }

    const sessionData = { email: user.email }
    localStorage.setItem('crop_ai_session', JSON.stringify(sessionData))
    setCurrentUser(sessionData)
    
    return true
  }

  const logout = () => {
    localStorage.removeItem('crop_ai_session')
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
