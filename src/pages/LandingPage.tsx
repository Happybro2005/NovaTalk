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
  Apple,
  PlayCircle,
} from 'lucide-react'
import AmbientBackdrop from '../components/AmbientBackdrop'
import Logo from '../components/Logo'
import { Button, Eyebrow, MotionGlassCard, GlassCard } from '../components/ui'
<<<<<<< HEAD
<<<<<<< HEAD

const stats = [
  { value: '2.4M+', label: 'Conversations sparked' },
  { value: '180+', label: 'Countries connected' },
  { value: '40K', label: 'Communities orbiting' },
  { value: '99.9%', label: 'Uptime across the galaxy' },
=======
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
import { useAuth } from '../contexts/AuthContext'

const stats = [
  { value: '2.4M+', label: 'Study connections sparked' },
  { value: '180+', label: 'Campuses connected' },
  { value: '40K', label: 'Project groups orbiting' },
  { value: '99.9%', label: 'Realtime sync uptime' },
<<<<<<< HEAD
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
]

const features = [
  {
    tag: 'ORION',
<<<<<<< HEAD
<<<<<<< HEAD
    title: 'Stranger Match',
    desc: 'A matching engine that pairs you with someone new in under a second — like a hunter finding its mark in a crowded sky.',
=======
    title: 'AI Study Match',
    desc: 'A matching engine that pairs you with students by department, semester, subjects, interests, and skills in seconds.',
>>>>>>> origin/Shubh
=======
    title: 'AI Study Match',
    desc: 'A matching engine that pairs you with students by department, semester, subjects, interests, and skills in seconds.',
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
    icon: Sparkles,
  },
  {
    tag: 'LYRA',
<<<<<<< HEAD
<<<<<<< HEAD
    title: 'Communities',
    desc: 'Small constellations of people who share your frequency — join, post, and grow a space around what you care about.',
=======
    title: 'Study groups',
    desc: 'Small constellations built around subjects and project goals — join, post, and learn together.',
>>>>>>> origin/Shubh
=======
    title: 'Study groups',
    desc: 'Small constellations built around subjects and project goals — join, post, and learn together.',
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
    icon: Users,
  },
  {
    tag: 'POLARIS',
<<<<<<< HEAD
<<<<<<< HEAD
    title: 'Friends, always findable',
    desc: 'The one contact that never moves. Turn a good stranger chat into a lasting connection you can always find again.',
=======
    title: 'Mentors and peers',
    desc: 'Turn a good study match into a lasting academic connection you can always find again.',
>>>>>>> origin/Shubh
=======
    title: 'Mentors and peers',
    desc: 'Turn a good study match into a lasting academic connection you can always find again.',
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
    icon: Star,
  },
  {
    tag: 'AEGIS',
    title: 'Safety by design',
    desc: 'Block, report, and moderation tooling built in from the first message — so the sky stays safe to explore.',
    icon: ShieldCheck,
  },
  {
    tag: 'VEGA',
    title: 'Real-time everything',
    desc: 'Typing indicators, presence, voice notes and media — delivered the instant they happen, no refresh required.',
    icon: MessageCircle,
  },
  {
    tag: 'CARTOGRAPHY',
<<<<<<< HEAD
<<<<<<< HEAD
    title: 'A world, not a feed',
    desc: 'Discover people and communities across languages and time zones with a map that actually feels alive.',
=======
    title: 'A campus network, not a feed',
    desc: 'Discover students, departments, and communities across campus with a map that actually feels alive.',
>>>>>>> origin/Shubh
=======
    title: 'A campus network, not a feed',
    desc: 'Discover students, departments, and communities across campus with a map that actually feels alive.',
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
    icon: Globe2,
  },
]

const testimonials = [
  {
    quote:
<<<<<<< HEAD
<<<<<<< HEAD
      'I matched with someone in Lagos over a shared obsession with vinyl records. Three months later we still talk daily.',
    name: 'Amara O.',
    role: 'NovaTalk since 2025',
  },
  {
    quote: 'The community for indie game devs I joined here is more active than my actual Discord server.',
    name: 'Ren K.',
    role: 'Community: PixelForge',
  },
  {
    quote: 'It feels like the internet used to feel — a little unpredictable, mostly kind.',
    name: 'Priya S.',
    role: 'Stranger Chat regular',
=======
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
      'I found a coding partner in my department and we finished a project I had been stuck on for weeks.',
    name: 'Student A',
    role: 'Computer Science, Semester 5',
  },
  {
    quote: 'The study group for database systems here is more active than my class WhatsApp chat.',
    name: 'Student B',
    role: 'Project collaboration lead',
  },
  {
    quote: 'It feels like the campus network I always wanted — helpful, fast, and actually specific to what I need.',
    name: 'Student C',
    role: 'Study match regular',
<<<<<<< HEAD
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
  },
]

export default function LandingPage() {
<<<<<<< HEAD
<<<<<<< HEAD
=======
  const { currentUser } = useAuth()

>>>>>>> origin/Shubh
=======
  const { currentUser } = useAuth()

>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
  return (
    <div className="relative min-h-screen font-[var(--font-body)]">
      <AmbientBackdrop />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050816]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-[#CBD5E1] md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#stats" className="transition-colors hover:text-white">Stats</a>
            <a href="#stories" className="transition-colors hover:text-white">Stories</a>
            <a href="#download" className="transition-colors hover:text-white">Download</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-28 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
<<<<<<< HEAD
<<<<<<< HEAD
          <Eyebrow>LIVE · 84,213 STRANGERS ONLINE NOW</Eyebrow>
=======
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
<<<<<<< HEAD
<<<<<<< HEAD
          Every stranger is a
          <br />
          <span className="text-gradient">star you haven't met.</span>
=======
          Every student is a
          <br />
          <span className="text-gradient">potential collaborator.</span>
>>>>>>> origin/Shubh
=======
          Every student is a
          <br />
          <span className="text-gradient">potential collaborator.</span>
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg text-[#CBD5E1]"
        >
<<<<<<< HEAD
<<<<<<< HEAD
          NovaTalk pairs you with real people in real time, then helps the good
          ones stick — through friends, communities, and a map of conversation
          worth exploring.
=======
          NovaTalk pairs you with the right students in real time, then helps the good
          matches stick — through study partners, project teams, communities, and
          live doubt-solving spaces.
>>>>>>> origin/Shubh
=======
          NovaTalk pairs you with the right students in real time, then helps the good
          matches stick — through study partners, project teams, communities, and
          live doubt-solving spaces.
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
          <Link to="/register">
            <Button size="lg" className="group">
<<<<<<< HEAD
<<<<<<< HEAD
              Start a conversation
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="secondary">See it in action</Button>
=======
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
              Find a study match
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link to={currentUser ? '/dashboard' : '/login'}>
            <Button size="lg" variant="secondary">See the network</Button>
<<<<<<< HEAD
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
          </Link>
        </motion.div>

        {/* Floating preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="animate-float glass-strong glow-primary mt-16 w-full max-w-2xl rounded-2xl p-5 text-left"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse-glow" />
<<<<<<< HEAD
<<<<<<< HEAD
            <span className="eyebrow">MATCHED · SOMEWHERE NEAR REYKJAVÍK</span>
=======
              <span className="eyebrow">MATCHED · COMPUTER SCIENCE, SEMESTER 5</span>
>>>>>>> origin/Shubh
=======
              <span className="eyebrow">MATCHED · COMPUTER SCIENCE, SEMESTER 5</span>
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-start">
              <div className="max-w-xs rounded-2xl rounded-bl-sm bg-white/[0.08] px-4 py-2.5 text-sm text-[#CBD5E1]">
                okay wait, you also think Saturn is the most photogenic planet?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-xs rounded-2xl rounded-br-sm bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-4 py-2.5 text-sm text-white">
                obviously. the rings do all the work for it
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

      {/* Stats */}
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

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>THE CATALOG</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
<<<<<<< HEAD
<<<<<<< HEAD
            Six ways NovaTalk maps a conversation
          </h2>
          <p className="mt-3 text-[#CBD5E1]">
            Every part of the product is named for the piece of sky it plays — a small nod to the thing that inspired it.
=======
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
            Six ways NovaTalk maps a student network
          </h2>
          <p className="mt-3 text-[#CBD5E1]">
            Every part of the product is named for the piece of campus life it helps organize — matching, grouping, and collaborating.
<<<<<<< HEAD
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
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

      {/* Testimonials */}
      <section id="stories" className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>FIELD REPORTS</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
<<<<<<< HEAD
<<<<<<< HEAD
            People who found their orbit
=======
            Students who found their team
>>>>>>> origin/Shubh
=======
            Students who found their team
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
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

      {/* Download */}
      <section id="download" className="mx-auto max-w-6xl px-6 pb-28">
        <GlassCard strong className="glow-accent relative overflow-hidden px-8 py-14 text-center md:px-16">
          <Eyebrow>COMING TO YOUR POCKET</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
<<<<<<< HEAD
<<<<<<< HEAD
            Take the sky with you
=======
            Take your campus network with you
>>>>>>> origin/Shubh
=======
            Take your campus network with you
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#CBD5E1]">
            Native apps for iOS and Android are in orbit — join the list to be notified the moment they launch.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary">
              <Apple size={18} /> Notify me on iOS
            </Button>
            <Button size="lg" variant="secondary">
              <PlayCircle size={18} /> Notify me on Android
            </Button>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
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
