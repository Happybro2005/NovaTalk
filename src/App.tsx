import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { userService } from './services/userService'
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
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/SupportPage'
import StudyGroupsPage from './pages/StudyGroupsPage'
import GroupChatPage from './pages/GroupChatPage'
import DirectMessagePage from './pages/DirectMessagePage'
import NotFoundPage from './pages/NotFoundPage'
import ContextMenu from './components/ContextMenu'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-sm text-[#CBD5E1]">
        Loading your orbit...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return
    if (!currentUser) {
      setIsAdmin(false)
      return
    }

    let active = true
    userService.getUserProfile(currentUser.uid).then((profile) => {
      if (!active) return
      const role = profile?.role?.toString().trim().toLowerCase()
      setIsAdmin(role === 'admin' || role === 'moderator')
    }).catch(() => {
      if (active) setIsAdmin(false)
    })

    return () => { active = false }
  }, [currentUser, loading])

  if (loading || (currentUser && isAdmin === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-sm text-[#CBD5E1]">
        Loading...
      </div>
    )
  }

  // If not admin, show identical 404 "Page does not exist" without revealing admin route
  if (!currentUser || !isAdmin) {
    return <NotFoundPage />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ContextMenu />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/stranger-chat" element={<ProtectedRoute><StrangerChatPage /></ProtectedRoute>} />
        <Route path="/study-match" element={<ProtectedRoute><StrangerChatPage /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        <Route path="/friend-requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="/study-groups" element={<ProtectedRoute><StudyGroupsPage /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><StudyGroupsPage /></ProtectedRoute>} />
        <Route path="/groups/:groupId/chat" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><DirectMessagePage /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminGate />} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />

        {/* Catch-all for non-existent URLs on localhost and novatalk.pages.dev */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
