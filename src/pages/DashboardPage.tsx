import { useEffect, useState } from 'react'
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

const fallbackSuggestedFriends = [
  { name: 'Sana P.', mutual: '3 mutual communities' },
  { name: 'Leo B.', mutual: '12 mutual friends' },
  { name: 'Iris W.', mutual: 'Also into astronomy' },
]

const fallbackNotifications = [
  { title: 'New', message: 'Leo B. accepted your friend request.' },
  { title: 'Chat', message: 'You have 3 unread messages.' },
]

function getStoredUser() {
  try {
    const raw = localStorage.getItem('novatalk-user')
    if (!raw) return { name: 'Your Name', username: '@username' }
    const user = JSON.parse(raw)
    return user && typeof user === 'object' ? user : { name: 'Your Name', username: '@username' }
  } catch {
    return { name: 'Your Name', username: '@username' }
  }
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>({
    recentChats: [],
    onlineFriends: [],
    suggestedFriends: fallbackSuggestedFriends,
    feed: [],
    notifications: fallbackNotifications,
  })
  const [loading, setLoading] = useState(true)
  const profile = getStoredUser()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [communitiesRes, friendsRes, requestsRes, notificationsRes] = await Promise.all([
          fetch('/api/communities'),
          fetch('/api/friends/u1'),
          fetch('/api/friends/requests/u1'),
          fetch('/api/notifications/u1'),
        ])

        const communities = communitiesRes.ok ? await communitiesRes.json() : { communities: [] }
        const friends = friendsRes.ok ? await friendsRes.json() : { friends: [] }
        const requests = requestsRes.ok ? await requestsRes.json() : { incoming: [], outgoing: [] }
        const notifications = notificationsRes.ok ? await notificationsRes.json() : { notifications: [] }

        const feed = (communities.communities || []).flatMap((community: any) =>
          (community.posts || []).map((post: any) => ({
            author: post.authorName || community.name,
            time: new Date(post.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            content: post.text,
            likes: post.likes || 0,
            comments: (post.comments || []).length,
          })),
        )

        const recentChats = (friends.friends || []).map((friend: any, index: number) => ({
          name: friend.name || `Friend ${index + 1}`,
          preview: index % 2 === 0 ? 'Let’s talk later.' : 'Online now',
          time: index === 0 ? '2m' : `${(index + 1) * 8}m`,
          online: true,
        }))

        setDashboard({
          recentChats: recentChats.length ? recentChats : [
            { name: 'Yuki T.', preview: 'that constellation joke was actually so good', time: '2m', online: true },
            { name: 'Marcus L.', preview: 'sent a photo', time: '18m', online: true },
            { name: 'Ana R.', preview: 'okay talk tomorrow then!', time: '1h', online: false },
          ],
          onlineFriends: (friends.friends || []).map((friend: any) => friend.name || 'Friend').slice(0, 5),
          suggestedFriends: requests.incoming?.length
            ? requests.incoming.map((item: any) => ({
                name: item.from,
                mutual: 'Connected through NovaTalk',
              }))
            : fallbackSuggestedFriends,
          feed: feed.length ? feed : [
            {
              author: 'PixelForge Community',
              time: '32m ago',
              content: 'Our monthly game jam theme just dropped: "Signals from Elsewhere." Submissions open all week.',
              likes: 214,
              comments: 38,
            },
          ],
          notifications: (notifications.notifications || []).length
            ? notifications.notifications.slice(0, 2).map((item: any) => ({
                title: item.type === 'friend_request' ? 'New' : 'Chat',
                message: item.message,
              }))
            : fallbackNotifications,
        })
      } catch (error) {
        console.error('Dashboard data fetch failed', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Eyebrow>DASHBOARD</Eyebrow>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {profile.name.split(' ')[0] || 'Friend'}
        </h1>
        <p className="mt-1.5 text-[#CBD5E1]">Here's what's happening across your orbit today.</p>
      </motion.div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {quickActions.map((a, i) => (
          <Link key={a.label} to={a.to}>
            <MotionGlassCard delay={i * 0.05} className="flex items-center gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F8CFF]/15 text-[#4F8CFF]">
                <a.icon size={20} />
              </div>
              <span className="text-sm font-medium text-white">{a.label}</span>
            </MotionGlassCard>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent chats</h2>
              <Link to="/friends" className="text-xs text-[#4F8CFF] hover:underline">View all</Link>
            </div>
            <div className="space-y-1">
              {(loading ? [
                { name: 'Loading...', preview: 'Fetching your recent chats', time: '', online: false },
              ] : dashboard.recentChats).map((c: any) => (
                <div key={c.name + c.time} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.05]">
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
                  {c.time && <span className="shrink-0 text-xs text-[#CBD5E1]/50">{c.time}</span>}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Community feed</h2>
              <Link to="/communities" className="text-xs text-[#4F8CFF] hover:underline">Explore</Link>
            </div>
            <div className="space-y-4">
              {(loading ? [{ author: 'Loading', time: '', content: 'Loading community posts…', likes: 0, comments: 0 }] : dashboard.feed).map((post: any, i: number) => (
                <div key={`${post.author}-${i}`} className={i > 0 ? 'border-t border-white/[0.06] pt-4' : ''}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F8CFF] text-xs font-semibold">
                      {post.author[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{post.author}</div>
                      {post.time && <div className="text-xs text-[#CBD5E1]/50">{post.time}</div>}
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

        <div className="space-y-6">
          <GlassCard className="p-5">
            <h2 className="mb-4 font-semibold text-white">Online now</h2>
            <div className="flex flex-wrap gap-3">
              {(loading ? ['Loading'] : dashboard.onlineFriends).map((name: string) => (
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

          <GlassCard className="p-5">
            <h2 className="mb-4 font-semibold text-white">Suggested friends</h2>
            <div className="space-y-3">
              {(loading ? [{ name: 'Loading', mutual: 'Loading suggestions' }] : dashboard.suggestedFriends).map((f: any) => (
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

          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Notifications</h2>
              <Bell size={16} className="text-[#CBD5E1]/60" />
            </div>
            <div className="space-y-3 text-sm">
              {(loading ? [{ title: 'Loading', message: 'Fetching notifications...' }] : dashboard.notifications).map((n: any, index: number) => (
                <div key={`${n.title}-${index}`} className="flex gap-2.5">
                  <Badge tone={n.title === 'New' ? 'success' : 'primary'} className="mt-0.5 shrink-0">{n.title}</Badge>
                  <span className="text-[#CBD5E1]">{n.message}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  )
}
