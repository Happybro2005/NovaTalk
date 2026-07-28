import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Camera, Mail, Lock, User, AtSign, Globe, Calendar } from 'lucide-react'
import AmbientBackdrop from '../components/AmbientBackdrop'
import Logo from '../components/Logo'
import { Button, GlassCard, Input, Eyebrow } from '../components/ui'

const interests = [
  'Gaming', 'Music', 'Movies', 'Tech', 'Art', 'Books',
  'Sports', 'Travel', 'Food', 'Anime', 'Fitness', 'Photography',
]

export default function RegisterPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Tech', 'Music'])

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  return (
    <div className="relative min-h-screen px-4 py-12">
      <AmbientBackdrop variant="quiet" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <Logo size="lg" />
          </Link>
        </div>

        <GlassCard strong className="glow-primary p-8">
          <Eyebrow>NEW SIGNAL</Eyebrow>
          <h1 className="mt-2 text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-[#CBD5E1]">A few details, then you're out among the stars.</p>

          <form className="mt-7 space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-white/20 bg-white/[0.04] text-[#CBD5E1]/50">
                <Camera size={22} />
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-white shadow-lg"
                >
                  +
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Profile picture</p>
                <p className="text-xs text-[#CBD5E1]/60">PNG or JPG, up to 5MB.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Display name" placeholder="Prashant Singh" icon={<User size={16} />} />
              <Input label="Username" placeholder="@prashant" icon={<AtSign size={16} />} />
            </div>

            <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail size={16} />} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Password" type="password" placeholder="••••••••" icon={<Lock size={16} />} />
              <Input label="Confirm password" type="password" placeholder="••••••••" icon={<Lock size={16} />} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#CBD5E1]">Country</label>
                <div className="relative">
                  <Globe size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CBD5E1]/70" />
                  <select className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20">
                    <option className="bg-[#0F172A]">India</option>
                    <option className="bg-[#0F172A]">United States</option>
                    <option className="bg-[#0F172A]">United Kingdom</option>
                    <option className="bg-[#0F172A]">Japan</option>
                  </select>
                </div>
              </div>
              <Input label="Date of birth" type="date" icon={<Calendar size={16} />} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#CBD5E1]">Gender</label>
                <select className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20">
                  <option className="bg-[#0F172A]">Prefer not to say</option>
                  <option className="bg-[#0F172A]">Male</option>
                  <option className="bg-[#0F172A]">Female</option>
                  <option className="bg-[#0F172A]">Non-binary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#CBD5E1]">Language</label>
              <select className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20">
                <option className="bg-[#0F172A]">English</option>
                <option className="bg-[#0F172A]">Hindi</option>
                <option className="bg-[#0F172A]">Spanish</option>
                <option className="bg-[#0F172A]">Japanese</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#CBD5E1]">Interests</label>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => {
                  const active = selectedInterests.includes(interest)
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'border-[#4F8CFF]/50 bg-[#4F8CFF]/20 text-white'
                          : 'border-white/10 bg-white/[0.03] text-[#CBD5E1]/70 hover:bg-white/[0.06]'
                      }`}
                    >
                      {interest}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-[#CBD5E1]">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-[#4F8CFF]" />
              I agree to the <a href="#" className="text-[#4F8CFF] hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-[#4F8CFF] hover:underline">Privacy Policy</a>.
            </label>

            <Button type="submit" size="lg" className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#CBD5E1]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#4F8CFF] hover:underline">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  )
}
