import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import AmbientBackdrop from '../components/AmbientBackdrop'
import Logo from '../components/Logo'
import { Button, GlassCard, Input } from '../components/ui'

export default function ForgotPasswordPage() {
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
          <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail size={16} />} />
            <Button type="submit" size="lg" className="w-full">Send reset link</Button>
          </form>
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-[#CBD5E1] hover:text-white">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  )
}
