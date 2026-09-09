import { type ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  UserPlus,
  Compass,
  Bell,
  Settings,
  LifeBuoy,
  Menu,
  X,
  Search,
  LogOut,
} from 'lucide-react'
import { collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import Logo from './Logo'
import AmbientBackdrop from './AmbientBackdrop'
import { Button } from './ui'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Study Match', icon: MessageCircle, to: '/study-match' },
  { label: 'Friends', icon: Users, to: '/friends' },
  { label: 'Requests', icon: UserPlus, to: '/friend-requests' },
  { label: 'Communities', icon: Compass, to: '/communities' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Settings', icon: Settings, to: '/settings' },
  { label: 'Support', icon: LifeBuoy, to: '/support' },
]

const mobileNavItems = navItems.slice(0, 5)

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [studyUnread, setStudyUnread] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  useEffect(() => {
    if (!currentUser) return

    const userRef = doc(db, 'users', currentUser.uid)
    const unsubscribe = onSnapshot(userRef, async (userSnap) => {
      const userData = userSnap.data() as { lastOpenedStudyMatchAt?: { toMillis?: () => number } } | undefined
      const openedAt = userData?.lastOpenedStudyMatchAt?.toMillis?.() ?? 0
      const conversationSnap = await getDocs(
        query(collection(db, 'conversations'), where('participantIds', 'array-contains', currentUser.uid), where('type', '==', 'study'))
      )
      const unread = conversationSnap.docs.some((conversationDoc) => {
        const conversation = conversationDoc.data() as { lastMessage?: { senderId?: string; timestamp?: { toMillis?: () => number } } | null }
        const messageTime = conversation.lastMessage?.timestamp?.toMillis?.() ?? 0
        return Boolean(conversation.lastMessage && conversation.lastMessage.senderId !== currentUser.uid && messageTime > openedAt)
      })
      setStudyUnread(unread)
    })

    return unsubscribe
  }, [currentUser])

  return (
    <div className="relative min-h-screen">
      <AmbientBackdrop variant="quiet" />
      <div className="flex">{/* existing content unchanged */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#050816]/60 backdrop-blur-xl lg:flex">
          <div className="px-6 py-6"><Logo /></div>
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => {
              const active = location.pathname === item.to
              const unreadDot = item.to === '/study-match' && studyUnread
              return (
                <Link key={item.to} to={item.to} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${active ? 'glass text-white glow-primary' : 'text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white'}`}>
                  <item.icon size={18} />
                  {item.label}
                  {unreadDot && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[#EF4444]" />}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/[0.06] p-4">
            <Link to="/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.05]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold text-white">{currentUser?.displayName?.[0]?.toUpperCase() || 'U'}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{currentUser?.displayName || 'User'}</div>
                <div className="truncate text-xs text-[#10B981]">Online</div>
              </div>
            </Link>
            <Button variant="secondary" className="mt-3 w-full" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <aside className="glass-strong absolute left-0 top-0 h-full w-72 p-4">
              <div className="mb-6 flex items-center justify-between px-2 py-2">
                <Logo />
                <button onClick={() => setSidebarOpen(false)} className="text-[#CBD5E1]"><X size={20} /></button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const unreadDot = item.to === '/study-match' && studyUnread
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#CBD5E1] hover:bg-white/[0.06] hover:text-white">
                      <item.icon size={18} />
                      {item.label}
                      {unreadDot && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[#EF4444]" />}
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-6 border-t border-white/[0.06] pt-4">
                <Button variant="secondary" className="w-full" onClick={() => { setSidebarOpen(false); void handleLogout() }}>
                  <LogOut size={16} /> Logout
                </Button>
              </div>
            </aside>
          </div>
        )}

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/[0.06] bg-[#050816]/70 px-4 py-3.5 backdrop-blur-xl sm:px-6">
            <button onClick={() => setSidebarOpen(true)} className="text-[#CBD5E1] lg:hidden"><Menu size={22} /></button>
            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CBD5E1]/50" />
              <input placeholder="Search people, communities..." className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-10 pr-4 text-sm text-white placeholder:text-[#CBD5E1]/40 outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link to="/notifications" className="relative rounded-xl p-2 text-[#CBD5E1] hover:bg-white/[0.06] hover:text-white"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#EF4444]" /></Link>
              <Link to="/profile"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-xs font-semibold text-white">{currentUser?.displayName?.[0]?.toUpperCase() || 'U'}</div></Link>
            </div>
          </header>
          <main className="px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
        </div>
      </div>
      <nav className="glass-strong fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/[0.08] px-2 py-2 lg:hidden">
        {mobileNavItems.map((item) => {
          const active = location.pathname === item.to
          const unreadDot = item.to === '/study-match' && studyUnread
          return (
            <Link key={item.to} to={item.to} className={`relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${active ? 'text-[#4F8CFF]' : 'text-[#CBD5E1]/70'}`}>
              <item.icon size={19} />
              {item.label.split(' ')[0]}
              {unreadDot && <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-[#EF4444]" />}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
