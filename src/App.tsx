import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import AdminGate from './pages/admin/AdminGate'
import AdminDashboard from './pages/admin/AdminDashboard'

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] px-6 py-12 text-center">
      <div className="glass-strong max-w-xl rounded-2xl p-8">
        <p className="eyebrow">UNDER CONSTRUCTION</p>
        <h1 className="mt-3 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h1>
        <p className="mt-3 text-[#CBD5E1]">{description}</p>
      </div>
    </div>
  )
}

function StrangerChatPage() {
  const [status, setStatus] = useState('Ready to find a stranger')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const findMatch = async () => {
    setLoading(true)
    setStatus('Looking for a stranger...')

    try {
      const response = await fetch('/api/matchmaking/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u1' }),
      })

      const payload = await response.json()
      setData(payload)

      if (payload.matched) {
        setStatus(`Matched with ${payload.partner?.name || 'a stranger'}`)
      } else {
        setStatus(payload.message || 'Waiting for a match...')
      }
    } catch (error) {
      setStatus('Server is unavailable. Please start the backend server first.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] px-6 py-12">
      <div className="glass-strong w-full max-w-xl rounded-2xl p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">STRANGER CHAT</p>
            <h1 className="mt-3 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Match with someone new
            </h1>
          </div>

          {loading && (
            <div className="flex items-center gap-2 rounded-full border border-[#4F8CFF]/30 bg-[#4F8CFF]/10 px-3 py-2 text-xs text-[#4F8CFF]">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#4F8CFF]" />
              Searching
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[#CBD5E1]">
          <p className="text-white">{status}</p>
        </div>

        {data && (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm text-[#CBD5E1]">
            <div><strong className="text-white">Status:</strong> {data.matched ? 'Matched' : 'Queued'}</div>
            <div><strong className="text-white">Message:</strong> {data.message}</div>
            {data.partner && <div><strong className="text-white">Partner:</strong> {data.partner.name}</div>}
          </div>
        )}

        <button
          onClick={findMatch}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#4F8CFF]/20 hover:brightness-110"
        >
          {loading ? 'Finding...' : 'Start stranger chat'}
        </button>
      </div>
    </div>
  )
}

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
        <Route path="/friends" element={<PlaceholderPage title="Friends" description="Friend management and discovery will appear here." />} />
        <Route path="/friend-requests" element={<PlaceholderPage title="Friend Requests" description="Incoming and outgoing requests will appear here." />} />
        <Route path="/communities" element={<PlaceholderPage title="Communities" description="Community feed and groups will appear here." />} />
        <Route path="/notifications" element={<PlaceholderPage title="Notifications" description="Alerts and updates will appear here." />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" description="Profile and account preferences will appear here." />} />
        <Route path="/support" element={<PlaceholderPage title="Support" description="Support center and help tools will appear here." />} />
        <Route path="/admin" element={<AdminGate />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
