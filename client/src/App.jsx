import { Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider }         from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import NotificationPopups       from './components/NotificationPopups'

import HomePage                 from './pages/HomePage'
import DashboardPage            from './pages/DashboardPage'
import BugReportPage            from './pages/BugReportPage'
import HistoryPage              from './pages/HistoryPage'
import SettingsPage             from './pages/SettingsPage'
import ProfilePage              from './pages/ProfilePage'
import LoginPage                from './pages/LoginPage'
import RegisterPage             from './pages/RegisterPage'
import NotFoundPage             from './pages/NotFoundPage'
import JiraWatchlistPage        from './pages/JiraWatchlistPage'
import JiraWorklogPage          from './pages/JiraWorklogPage'
import NotificationsPage        from './pages/NotificationsPage'
import TemplateManagementPage   from './pages/TemplateManagementPage'
import UserManagementPage       from './pages/UserManagementPage'
import ProtectedRoute           from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationPopups />
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/dashboard"       element={<DashboardPage />} />
          <Route path="/bug-report"      element={<BugReportPage />} />
          <Route path="/history"         element={<HistoryPage />} />
          <Route path="/settings"        element={<SettingsPage />} />
          <Route path="/templates"       element={<TemplateManagementPage />} />
          <Route path="/jira-worklog"    element={<JiraWorklogPage />} />
          <Route path="/admin/users"     element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
          <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/jira-watchlist"  element={<ProtectedRoute><JiraWatchlistPage /></ProtectedRoute>} />
          <Route path="/notifications"   element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="*"                element={<NotFoundPage />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
