import { Navigate, Route, Routes } from 'react-router-dom'
import AIChat from './components/AIChat.jsx'
import AccountPage from './components/AccountPage.jsx'
import CropSuggestion from './components/CropSuggestion.jsx'
import NDVIAnalysis from './components/NDVIAnalysis.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import LandingPage from './LandingPage.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/ndvi-analysis" element={<NDVIAnalysis />} />
          <Route path="/crop-suggestion" element={<CropSuggestion />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
