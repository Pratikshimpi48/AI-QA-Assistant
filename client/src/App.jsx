import { Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import HomePage         from './pages/HomePage'
import DashboardPage    from './pages/DashboardPage'
import BugReportPage    from './pages/BugReportPage'
import HistoryPage      from './pages/HistoryPage'
import SettingsPage     from './pages/SettingsPage'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import NotFoundPage     from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"            element={<HomePage />} />
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/register"    element={<RegisterPage />} />
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/bug-report"  element={<BugReportPage />} />
        <Route path="/history"     element={<HistoryPage />} />
        <Route path="/settings"    element={<SettingsPage />} />
        <Route path="*"            element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
