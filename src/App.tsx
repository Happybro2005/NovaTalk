import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import AdminGate from './pages/admin/AdminGate'
import AdminDashboard from './pages/admin/AdminDashboard'
import StrangerChatPage from './pages/StrangerChatPage'
import FriendsPage from './pages/FriendsPage'
import RequestsPage from './pages/RequestsPage'
import CommunitiesPage from './pages/CommunitiesPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/SupportPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/stranger-chat" element={<StrangerChatPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/friend-requests" element={<RequestsPage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
