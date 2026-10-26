import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, Home } from 'lucide-react'
import AmbientBackdrop from '../components/AmbientBackdrop'
import { Button, GlassCard } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'

export default function NotFoundPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AmbientBackdrop variant="aurora" />

      <GlassCard strong className="w-full max-w-lg p-8 sm:p-10 text-center relative z-10 shadow-2xl shadow-black/60">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F8CFF]/20 to-[#7C3AED]/20 border border-white/10 text-[#4F8CFF] shadow-inner">
          <Compass size={32} strokeWidth={2} />
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#4F8CFF]">404 ERROR</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Page does not exist
          </h1>
          <p className="mt-3 text-sm text-[#CBD5E1]/80 max-w-sm mx-auto leading-relaxed">
            The coordinates you navigated to could not be found or are not available in this orbit.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate(currentUser ? '/dashboard' : '/')
              }
            }}
          >
            <ArrowLeft size={16} /> Go back
          </Button>

          <Link to={currentUser ? '/dashboard' : '/'} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Home size={16} /> {currentUser ? 'Return to Dashboard' : 'Return Home'}
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
