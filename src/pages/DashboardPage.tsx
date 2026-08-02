import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shuffle, Users, Compass } from 'lucide-react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import AppShell from '../components/AppShell'
import { GlassCard, MotionGlassCard, Button, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { Conversation, User } from '../types/models'

const quickActions = [
  { label: 'New stranger chat', icon: Shuffle, to: '/stranger-chat', tone: 'primary' as const },
  { label: 'Browse friends', icon: Users, to: '/friends', tone: 'success' as const },
  { label: 'Explore communities', icon: Compass, to: '/communities', tone: 'warning' as const },
]

export default function DashboardPage() {
  const { currentUser } = useAuth()
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [friends, setFriends] = useState<User[]>([])

  useEffect(() => {
    if (!currentUser) return;
    
    async function fetchData() {
      try {
        const usersQuery = query(collection(db, 'users'), limit(10))
        const usersSnap = await getDocs(usersQuery)
        const usersList: User[] = []
        usersSnap.forEach(doc => {
          const u = doc.data() as User
          if (u.uid !== currentUser?.uid) {
            usersList.push(u)
          }
        })
        setFriends(usersList)

        const convQuery = query(
          collection(db, 'conversations'), 
          where('participantIds', 'array-contains', currentUser?.uid),
          orderBy('updatedAt', 'desc'),
          limit(5)
        )
        const convSnap = await getDocs(convQuery)
        const convList: any[] = []
        
        for (const docSnap of convSnap.docs) {
          const conv = docSnap.data() as Conversation
          const otherId = conv.participantIds.find(id => id !== currentUser?.uid)
          let otherName = 'Unknown'
          
          if (otherId) {
             const otherUserDoc = usersList.find(u => u.uid === otherId)
             if (otherUserDoc) {
                otherName = otherUserDoc.displayName
             } else {
                otherName = `User ${otherId.substring(0, 4)}`
             }
          }

          convList.push({
            id: conv.id,
            name: otherName,
            preview: conv.lastMessage?.previewText || 'Started a conversation',
            time: 'Recently',
            online: false
          })
        }
        setRecentChats(convList)
      } catch (err) {
        console.error("Error fetching dashboard data", err)
      }
    }
    fetchData()
  }, [currentUser])
  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Eyebrow>DASHBOARD</Eyebrow>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {currentUser?.displayName || 'User'}
        </h1>
        <p className="mt-1.5 text-[#CBD5E1]">Here's what's happening across your orbit today.</p>
      </motion.div>

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
        <div className="space-y-6 lg:col-span-2">
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent chats</h2>
              <Link to="/friends" className="text-xs text-[#4F8CFF] hover:underline">View all</Link>
            </div>
            {recentChats.length === 0 ? (
               <p className="text-sm text-[#CBD5E1]">No recent chats. Start one!</p>
            ) : (
              <div className="space-y-1">
                {recentChats.map((c) => (
                  <Link key={c.id} to={`/chat/${c.id}`} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/[0.05]">
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold">
                        {c.name[0]?.toUpperCase()}
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
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-5">
            <h2 className="mb-4 font-semibold text-white">Suggested friends</h2>
            {friends.length === 0 ? (
               <p className="text-sm text-[#CBD5E1]">No other users found.</p>
            ) : (
              <div className="space-y-3">
                {friends.map((f) => (
                  <div key={f.uid} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#4F8CFF] text-sm font-semibold text-white">
                      {f.displayName ? f.displayName[0].toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{f.displayName}</div>
                      <div className="truncate text-xs text-[#CBD5E1]/60">Joined recently</div>
                    </div>
                    <Button size="sm" variant="secondary" className="shrink-0 !px-3">Message</Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  )
}
