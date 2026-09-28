<<<<<<< HEAD
<<<<<<< HEAD
=======
import { useState } from 'react'
>>>>>>> origin/Shubh
=======
import { useState } from 'react'
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import AmbientBackdrop from '../components/AmbientBackdrop'
import Logo from '../components/Logo'
import { Button, GlassCard, Input } from '../components/ui'
<<<<<<< HEAD
<<<<<<< HEAD

export default function ForgotPasswordPage() {
=======
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { resetPassword } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return setError('Please enter your email address.')
    try {
      setMessage('')
      setError('')
      setLoading(true)
      await resetPassword(email)
      setMessage('Check your inbox — a reset link is on its way!')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AmbientBackdrop variant="quiet" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
        <GlassCard strong className="glow-primary p-8">
          <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-[#CBD5E1]">
            Enter the email tied to your account and we'll send a link to get you back online.
          </p>
<<<<<<< HEAD
<<<<<<< HEAD
          <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail size={16} />} />
            <Button type="submit" size="lg" className="w-full">Send reset link</Button>
=======
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {message}
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
<<<<<<< HEAD
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
          </form>
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-[#CBD5E1] hover:text-white">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  )
}
