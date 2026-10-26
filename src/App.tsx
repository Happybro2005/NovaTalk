import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { Ban } from 'lucide-react'
import { auth, db } from './firebase'
import { useAuth } from './contexts/AuthContext'
import { userService } from './services/userService'
import type { User } from './types/models'
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
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!currentUser) {
      setCheckingStatus(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as User
        // Check temporary ban expiry
        if (
          (data.accountStatus === 'banned' || data.accountStatus === 'suspended') &&
          data.banExpiresAt &&
          data.banExpiresAt > 0 &&
          Date.now() >= data.banExpiresAt
        ) {
          // Temporary ban has expired! Automatically unban user
          void updateDoc(doc(db, 'users', currentUser.uid), {
            accountStatus: 'active',
            banExpiresAt: null,
            banReason: null,
            bannedAt: null,
          })
          setUserProfile({ ...data, accountStatus: 'active', banExpiresAt: null })
        } else {
          setUserProfile(data)
        }
      }
      setCheckingStatus(false)
    }, () => {
      setCheckingStatus(false)
    })

    return () => unsubscribe()
  }, [currentUser, loading])

  if (loading || checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-sm text-[#CBD5E1]">
        Loading your orbit...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const isBanned = userProfile?.accountStatus === 'banned' || userProfile?.accountStatus === 'suspended'
  if (isBanned && userProfile) {
    const isTemp = Boolean(userProfile.banExpiresAt && userProfile.banExpiresAt > 0)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#0F1420]/95 p-7 text-center shadow-2xl backdrop-blur-xl ring-1 ring-red-500/20 animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/15 text-red-400 shadow-inner">
            <Ban size={34} />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Access Restricted
          </h1>
          <p className="mt-2 text-xs text-[#94A3B8]">
            Your NovaTalk account has been banned due to violations of our Community Guidelines. You cannot access the NovaTalk dashboard or platform features.
          </p>

          <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Ban Duration:</span>
              <span className={`font-semibold ${isTemp ? 'text-amber-400' : 'text-red-400'}`}>
                {isTemp ? 'Temporary Ban' : 'Permanent Ban'}
              </span>
            </div>
            {isTemp && userProfile.banExpiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Expires On:</span>
                <span className="text-white font-medium">
                  {new Date(userProfile.banExpiresAt).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <span className="text-[#94A3B8]">Reason:</span>
              <span className="text-right text-[#CBD5E1] truncate max-w-[210px]">
                {userProfile.banReason || 'Violation of Community Guidelines'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/support"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] py-2.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              Contact Support / Appeal Ban
            </Link>
            <button
              type="button"
              onClick={() => void auth.signOut()}
              className="rounded-xl py-2 text-xs font-medium text-[#94A3B8] hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
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

  if (loading || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-sm text-[#CBD5E1]">
        Verifying clearance...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/admin" replace />
  }

  if (isAdmin === false) {
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

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
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
