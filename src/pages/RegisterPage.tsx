import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { AtSign, Lock, Mail, User } from 'lucide-react'
import AmbientBackdrop from '../components/AmbientBackdrop'
import Logo from '../components/Logo'
import { Button, GlassCard, Input, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [novaName, setNovaName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!displayName.trim() || !username.trim() || !novaName.trim() || !email.trim() || !password || !confirmPassword) return setError('Please fill in all required fields.')
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) return setError('Username must be 3-24 letters, numbers, or underscores.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (!agreed) return setError('You must agree to the Terms of Service.')
    try {
      setLoading(true)
      setError('')
      await register(email.trim(), password, displayName.trim(), { username: username.trim(), novaName: novaName.trim() })
      navigate('/dashboard')
    } catch (registrationError: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a stronger password.',
        'auth/operation-not-allowed': 'Email/password registration is not enabled in Firebase Authentication.',
        'permission-denied': 'Account setup was blocked by Firestore permissions. Publish the latest firestore.rules and try again.',
      }
      setError(messages[registrationError?.code] ?? registrationError?.message ?? 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="relative flex min-h-screen items-center justify-center px-4 py-12"><AmbientBackdrop variant="quiet" /><motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md"><div className="mb-8 flex justify-center"><Link to="/"><Logo size="lg" /></Link></div><GlassCard strong className="glow-primary p-8"><Eyebrow>NEW SIGNAL</Eyebrow><h1 className="mt-2 text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Create your account</h1><p className="mt-1.5 text-sm text-[#CBD5E1]">Choose the name strangers will see on NovaTalk.</p>{error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}<form className="mt-7 space-y-4" onSubmit={handleSubmit}><Input label="Display name" placeholder="Your name" icon={<User size={16} />} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /><Input label="NovaName" placeholder="A name strangers see" icon={<AtSign size={16} />} value={novaName} onChange={(event) => setNovaName(event.target.value)} required /><p className="-mt-2 text-xs text-[#CBD5E1]">Your NovaName is your anonymous identity. It can be changed once every 2 months.</p><Input label="Username" placeholder="your_username" icon={<AtSign size={16} />} value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, ''))} required /><Input label="Email" type="email" placeholder="you@example.com" icon={<Mail size={16} />} value={email} onChange={(event) => setEmail(event.target.value)} required /><Input label="Password" type="password" placeholder="At least 6 characters" icon={<Lock size={16} />} value={password} onChange={(event) => setPassword(event.target.value)} required /><Input label="Confirm password" type="password" placeholder="Repeat your password" icon={<Lock size={16} />} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /><label className="flex items-start gap-2 text-sm text-[#CBD5E1]"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 h-4 w-4 accent-[#4F8CFF]" />I agree to the Terms of Service.</label><Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button></form><p className="mt-7 text-center text-sm text-[#CBD5E1]">Already have an account? <Link to="/login" className="font-medium text-[#4F8CFF] hover:underline">Sign in</Link></p></GlassCard></motion.div></div>
}
