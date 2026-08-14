import { API_BASE_URL } from './api.js'

export async function accountRequest(path, options = {}) {
  const session = JSON.parse(localStorage.getItem('agroguard_session') || 'null')
  if (!session?.token) {
    const error = new Error('Sign in required.')
    error.status = 401
    throw error
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Unable to update your account.')
  }
  if (response.status === 204) return null
  return response.json()
}

