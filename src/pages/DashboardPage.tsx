import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shuffle, Users, Compass, Bell, Heart, MessageSquare, Share2 } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, GlassCard, MotionGlassCard, Button, Eyebrow } from '../components/ui'

const quickActions = [
  { label: 'New stranger chat', icon: Shuffle, to: '/stranger-chat', tone: 'primary' as const },
  { label: 'Browse friends', icon: Users, to: '/friends', tone: 'success' as const },
  { label: 'Explore communities', icon: Compass, to: '/communities', tone: 'warning' as const },
]

const recentChats = [
  { name: 'Yuki T.', preview: 'that constellation joke was actually so good', time: '2m', online: true },
  { name: 'Marcus L.', preview: 'sent a photo', time: '18m', online: true },
  { name: 'Ana R.', preview: 'okay talk tomorrow then!', time: '1h', online: false },
  { name: 'Devon K.', preview: 'typing…', time: '2h', online: true },
]

const suggestedFriends = [
  { name: 'Sana P.', mutual: '3 mutual communities' },
  { name: 'Leo B.', mutual: '12 mutual friends' },
  { name: 'Iris W.', mutual: 'Also into astronomy' },
]

const onlineFriends = ['Yuki T.', 'Marcus L.', 'Devon K.', 'Sara J.', 'Tom H.']

const feed = [
  {
    author: 'PixelForge Community',
    time: '32m ago',
    content: 'Our monthly game jam theme just dropped: "Signals from Elsewhere." Submissions open all week.',
    likes: 214,
    comments: 38,
  },
  {
    author: 'Amara O.',
    time: '2h ago',
    content: 'Met someone on stranger chat who introduced me to a whole genre of Ethiopian jazz. This app is dangerous for my Spotify Wrapped.',
    likes: 89,
    comments: 12,
  },
]

export default function DashboardPage() {
  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Eyebrow>DASHBOARD</Eyebrow>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, Prashant
        </h1>
        <p className="mt-1.5 text-[#CBD5E1]">Here's what's happening across your orbit today.</p>
      </motion.div>

      {/* Quick actions */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {quickActions.map((a, i) => (
          <Link key={a.label} to={a.to}>
            <MotionGlassCard delay={i * 0.05} className="flex items-center gap-3 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F8CFF]/15 text-[#4F8CFF]`}>
                <a.icon size={20} />
              </div>
              <span className="text-sm font-medium text-white">{a.label}</span>
            </MotionGlassCard>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left / main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent chats */}
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent chats</h2>
              <Link to="/friends" className="text-xs text-[#4F8CFF] hover:underline">View all</Link>
            </div>
            <div className="space-y-1">
              {recentChats.map((c) => (
                <div key={c.name} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.05]">
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold">
                      {c.name[0]}
                    </div>
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0F172A] bg-[#10B981]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <div className="truncate text-xs text-[#CBD5E1]/70">{c.preview}</div>
                  </div>
                  <span className="shrink-0 text-xs text-[#CBD5E1]/50">{c.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Community feed */}
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Community feed</h2>
              <Link to="/communities" className="text-xs text-[#4F8CFF] hover:underline">Explore</Link>
            </div>
            <div className="space-y-4">
              {feed.map((post, i) => (
                <div key={i} className={i > 0 ? 'border-t border-white/[0.06] pt-4' : ''}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F8CFF] text-xs font-semibold">
                      {post.author[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{post.author}</div>
                      <div className="text-xs text-[#CBD5E1]/50">{post.time}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#CBD5E1]">{post.content}</p>
                  <div className="mt-3 flex items-center gap-5 text-xs text-[#CBD5E1]/70">
                    <button className="flex items-center gap-1.5 hover:text-[#EF4444]">
                      <Heart size={15} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white">
                      <MessageSquare size={15} /> {post.comments}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white">
                      <Share2 size={15} /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Online friends */}
          <GlassCard className="p-5">
            <h2 className="mb-4 font-semibold text-white">Online now</h2>
            <div className="flex flex-wrap gap-3">
              {onlineFriends.map((name) => (
                <div key={name} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold">
                      {name[0]}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0F172A] bg-[#10B981]" />
                  </div>
                  <span className="max-w-[60px] truncate text-[10px] text-[#CBD5E1]/70">{name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Suggested friends */}
          <GlassCard className="p-5">
            <h2 className="mb-4 font-semibold text-white">Suggested friends</h2>
            <div className="space-y-3">
              {suggestedFriends.map((f) => (
                <div key={f.name} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F8CFF] text-sm font-semibold">
                    {f.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{f.name}</div>
                    <div className="truncate text-xs text-[#CBD5E1]/60">{f.mutual}</div>
                  </div>
                  <Button size="sm" variant="secondary" className="shrink-0 !px-3">Add</Button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Notifications preview */}
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Notifications</h2>
              <Bell size={16} className="text-[#CBD5E1]/60" />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2.5">
                <Badge tone="success" className="mt-0.5 shrink-0">New</Badge>
                <span className="text-[#CBD5E1]">Leo B. accepted your friend request.</span>
              </div>
              <div className="flex gap-2.5">
                <Badge tone="primary" className="mt-0.5 shrink-0">Chat</Badge>
                <span className="text-[#CBD5E1]">You have 3 unread messages.</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  )
}
