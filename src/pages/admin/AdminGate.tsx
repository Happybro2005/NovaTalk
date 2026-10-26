import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { userService } from '../../services/userService'
import NotFoundPage from '../NotFoundPage'

export default function AdminGate() {
  const { currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  const verifyRole = useCallback(async () => {
    if (!currentUser) {
      setChecking(false)
      setAllowed(false)
      return
    }
    setChecking(true)
    try {
      const profile = await userService.getUserProfile(currentUser.uid)
      const normalizedRole = profile?.role?.toString().trim().toLowerCase()
      const canManage = normalizedRole === 'admin' || normalizedRole === 'moderator'
      setAllowed(canManage)
      setChecking(false)
      if (canManage) {
        navigate('/admin/dashboard', { replace: true })
      }
    } catch {
      setAllowed(false)
      setChecking(false)
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (loading) return
    void verifyRole()
  }, [loading, verifyRole])

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-sm text-[#CBD5E1]">
        Loading...
      </div>
    )
  }

  if (allowed) return null

  // If not admin, show standard 404 "Page does not exist" without disclosing admin route
  return <NotFoundPage />
}

