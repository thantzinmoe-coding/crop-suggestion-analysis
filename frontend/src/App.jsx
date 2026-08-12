import { Navigate, Route, Routes } from 'react-router-dom'
import AIChat from './components/AIChat.jsx'
import Community from './components/Community.jsx'
import CropSuggestion from './components/CropSuggestion.jsx'
import NDVIAnalysis from './components/NDVIAnalysis.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import LandingPage from './LandingPage.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import './App.css'

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-myanglow-navy"><div className="text-white">Loading...</div></div>
  }
  
  if (!currentUser) {
    return <Navigate to="/?auth=signin" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/ndvi-analysis" element={<NDVIAnalysis />} />
          <Route path="/crop-suggestion" element={<CropSuggestion />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/community" element={<Community />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
