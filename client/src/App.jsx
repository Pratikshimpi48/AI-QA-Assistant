import { Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage        from './pages/HomePage'
import DashboardPage   from './pages/DashboardPage'
import BugReportPage   from './pages/BugReportPage'
import HistoryPage     from './pages/HistoryPage'
import SettingsPage    from './pages/SettingsPage'
import NotFoundPage    from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/"            element={<HomePage />}      />
      <Route path="/dashboard"   element={<DashboardPage />} />
      <Route path="/bug-report"  element={<BugReportPage />} />
      <Route path="/history"     element={<HistoryPage />}   />
      <Route path="/settings"    element={<SettingsPage />}  />
      <Route path="*"            element={<NotFoundPage />}  />
    </Routes>
  )
}

export default App
