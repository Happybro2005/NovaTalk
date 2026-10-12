import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AmbientBackdrop from '../../components/AmbientBackdrop'
import { GlassCard } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'

export default function AdminGate() {
  const { currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    if (!currentUser) {
      setChecking(false)
      return
    }

    let active = true
    userService.getUserProfile(currentUser.uid).then((profile) => {
      if (!active) return
      const canManage = profile?.role === 'admin' || profile?.role === 'moderator'
      setAllowed(canManage)
      setError(canManage ? '' : 'Your account does not have admin access.')
      setChecking(false)
      if (canManage) navigate('/admin/dashboard', { replace: true })
    }).catch(() => {
      if (!active) return
      setError('Unable to verify your admin permissions.')
      setChecking(false)
    })

    return () => {
      active = false
    }
  }, [currentUser, loading, navigate])

  if (!loading && !currentUser) return <Navigate to="/login" replace />
  if (checking) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <AmbientBackdrop variant="aurora" />
        <GlassCard strong className="w-full max-w-md p-8 text-center text-[#CBD5E1]">Checking admin permissions...</GlassCard>
      </div>
    )
  }
  if (allowed) return null

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientBackdrop variant="aurora" />
      <GlassCard strong className="w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">Admin access required</h1>
        <p className="mt-3 text-sm text-[#CBD5E1]">{error}</p>
      </GlassCard>
    </div>
  )
}
