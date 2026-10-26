import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MessageCircle,
  Users,
  Globe2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react'
import AmbientBackdrop from '../components/AmbientBackdrop'
import Logo from '../components/Logo'
import { Button, Eyebrow, MotionGlassCard, GlassCard } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'

const stats = [
  { value: '50K+', label: 'new friendships sparked' },
  { value: '12K+', label: 'active groups' },
  { value: '24/7', label: 'live conversations' },
  { value: '99.9%', label: 'message sync uptime' },
]

const features = [
  {
    tag: 'DISCOVER',
    title: 'Friend discovery',
    desc: 'Meet people who match your vibe, interests, and social energy — then send a real request to connect.',
    icon: Sparkles,
  },
  {
    tag: 'COMMUNITIES',
    title: 'Group spaces',
    desc: 'Build circles around hobbies, goals, and shared moments — from small friend groups to active communities.',
    icon: Users,
  },
  {
    tag: 'CONNECTIONS',
    title: 'Real conversations',
    desc: 'From a first hello to a lasting friendship, NovaTalk keeps every chat fast, personal, and in the moment.',
    icon: Star,
  },
  {
    tag: 'PRIVACY',
    title: 'Comfort by design',
    desc: 'Control who sees your presence, when you reply, and how visible you want to be in every social room.',
    icon: ShieldCheck,
  },
  {
    tag: 'LIVE',
    title: 'Realtime social sync',
    desc: 'New messages, presence updates, and read receipts show up instantly without interrupting the flow.',
    icon: MessageCircle,
  },
  {
    tag: 'NETWORK',
    title: 'A social map, not a feed',
    desc: 'Follow your circles, find familiar faces, and explore fresh conversations that feel human instead of algorithmic.',
    icon: Globe2,
  },
]

const testimonials = [
  {
    quote: 'I met someone through NovaTalk and we ended up hanging out the same week. It felt natural, not forced.',
    name: 'Ari',
    role: 'Friendship match, weekend plans',
  },
  {
    quote: 'The group chat feels like my actual social circle — people check in, share ideas, and keep each other posted.',
    name: 'Mina',
    role: 'Community host',
  },
  {
    quote: 'It finally feels like a place to meet people who actually match your energy instead of just browsing profiles.',
    name: 'Jules',
    role: 'New connections, daily chat',
  },
]

export default function LandingPage() {
  const { currentUser } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
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
  }, [currentUser])

  const targetAppUrl = isAdmin ? '/admin/dashboard' : '/dashboard'

  return (
    <div className="relative min-h-screen font-[var(--font-body)]">
      <AmbientBackdrop />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050816]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-[#CBD5E1] md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#stats" className="transition-colors hover:text-white">Stats</a>
            <a href="#stories" className="transition-colors hover:text-white">Stories</a>
            <a href="#community" className="transition-colors hover:text-white">Community</a>
          </nav>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link to={targetAppUrl}>
                <Button size="sm">{isAdmin ? 'Admin Dashboard' : 'Open app'}</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-28 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        />
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Meet the people who
          <br />
          <span className="text-gradient">match your energy.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg text-[#CBD5E1]"
        >
          NovaTalk is where real friendships start: discover people worth knowing,
          jump into group conversations, and keep the moments moving with live chat,
          presence, and meaningful social circles.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
          <Link to="/register">
            <Button size="lg" className="group">
              Meet someone new
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link to={currentUser ? targetAppUrl : '/login'}>
            <Button size="lg" variant="secondary">{currentUser && isAdmin ? 'Admin Dashboard' : 'Explore the network'}</Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="animate-float glass-strong glow-primary mt-16 w-full max-w-2xl rounded-2xl p-5 text-left"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse-glow" />
            <span className="eyebrow">LIVE · FRIENDSHIP DISCOVERY</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-start">
              <div className="max-w-xs rounded-2xl rounded-bl-sm bg-white/[0.08] px-4 py-2.5 text-sm text-[#CBD5E1]">
                this city has a good vibe. are you always up for a coffee chat?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-xs rounded-2xl rounded-br-sm bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-4 py-2.5 text-sm text-white">
                absolutely. i’m in — let’s make it happen
              </div>
            </div>
            <div className="flex items-center gap-1.5 pl-1 text-xs text-[#CBD5E1]/60">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#CBD5E1]/60 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#CBD5E1]/60 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#CBD5E1]/60" />
              <span className="ml-1">typing…</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="stats" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, i) => (
            <MotionGlassCard key={s.label} delay={i * 0.08} className="p-6 text-center">
              <div className="text-3xl font-semibold text-gradient" style={{ fontFamily: 'var(--font-display)' }}>
                {s.value}
              </div>
              <div className="mt-1.5 text-sm text-[#CBD5E1]">{s.label}</div>
            </MotionGlassCard>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>THE CATALOG</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Six ways NovaTalk builds a real social circle
          </h2>
          <p className="mt-3 text-[#CBD5E1]">
            From first hello to lasting community, every flow is designed to help people connect, chat, and stay in touch naturally.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <MotionGlassCard key={f.tag} delay={i * 0.06} className="p-6">
              <div className="flex items-center gap-2">
                <f.icon size={20} className="text-[#4F8CFF]" />
                <Eyebrow>{f.tag}</Eyebrow>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#CBD5E1]">{f.desc}</p>
            </MotionGlassCard>
          ))}
        </div>
      </section>

      <section id="stories" className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>FIELD REPORTS</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            People who found their people
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <MotionGlassCard key={t.name} delay={i * 0.08} className="flex h-full flex-col p-6">
              <p className="flex-1 text-sm leading-relaxed text-[#CBD5E1]">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-white/[0.08] pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-[#CBD5E1]/70">{t.role}</div>
                </div>
              </div>
            </MotionGlassCard>
          ))}
        </div>
      </section>

      <section id="community" className="mx-auto max-w-6xl px-6 pb-28">
        <GlassCard strong className="glow-accent relative overflow-hidden px-8 py-14 text-center md:px-16">
          <Eyebrow>JOIN THE CIRCLE</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Keep your people close and discover more worth knowing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#CBD5E1]">
            NovaTalk is built for friendly introductions, shared group chats, and the kind of conversations that turn into real connection.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/register">
              <Button size="lg" className="group">
                Get started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </GlassCard>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Logo size="sm" />
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-[#CBD5E1]">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Support</a>
            <a href="#" className="hover:text-white">Status</a>
          </div>
          <span className="text-xs text-[#CBD5E1]/60">© 2026 NovaTalk. All signals reserved.</span>
        </div>
      </footer>
    </div>
  )
}
