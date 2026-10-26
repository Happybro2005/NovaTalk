import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  UserPlus,
  Bell,
  Settings,
  LifeBuoy,
  UsersRound,
  Menu,
  X,
  Search,
  LogOut,
  Shield,
} from 'lucide-react'
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import Logo from './Logo'
import AmbientBackdrop from './AmbientBackdrop'
import { Button } from './ui'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { notificationService } from '../services/notificationService'
import { friendService, type FriendSearchUser } from '../services/friendService'
import { chatService } from '../services/chatService'
import { studyGroupService } from '../services/studyGroupService'
import type { Group } from '../types/models'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Find New Friends', icon: MessageCircle, to: '/study-match' },
  { label: 'Friends', icon: Users, to: '/friends' },
  { label: 'Requests', icon: UserPlus, to: '/friend-requests' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Settings', icon: Settings, to: '/settings' },
  { label: 'Support', icon: LifeBuoy, to: '/support' },
  { label: 'Groups', icon: UsersRound, to: '/groups' },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [studyUnread, setStudyUnread] = useState(false)
  const [dashboardUnread, setDashboardUnread] = useState(false)
  const [groupsUnread, setGroupsUnread] = useState(false)
  const [friendRequestsUnread, setFriendRequestsUnread] = useState(false)
  const [messageRequestsUnread, setMessageRequestsUnread] = useState(false)
  const [groupInvitationsUnread, setGroupInvitationsUnread] = useState(false)
  const [notificationUnread, setNotificationUnread] = useState(false)
  const [newMessageToast, setNewMessageToast] = useState<{ id: string; title: string; preview: string; link: string } | null>(null)
  const [shellProfile, setShellProfile] = useState<{ novaName?: string; online?: boolean; role?: string } | null>(null)
  const [globalSearch, setGlobalSearch] = useState('')
  const [peopleResults, setPeopleResults] = useState<FriendSearchUser[]>([])
  const [groupResults, setGroupResults] = useState<Group[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const notificationIds = useRef<Set<string> | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { logout } = useAuth()

  useEffect(() => {
    const term = globalSearch.trim()
    if (!term || !currentUser) {
      setPeopleResults([])
      setGroupResults([])
      setSearchLoading(false)
      setSearchError('')
      return
    }

    let active = true
    setSearchLoading(true)
    setSearchError('')
    const timer = window.setTimeout(() => {
      void Promise.all([
        friendService.searchUsers(currentUser.uid, term),
        studyGroupService.getGroups(term),
      ]).then(([people, groups]) => {
        if (!active) return
        setPeopleResults(people)
        setGroupResults(groups.slice(0, 5))
      }).catch((error: unknown) => {
        if (active) setSearchError(error instanceof Error ? error.message : 'Unable to search people and groups.')
      }).finally(() => {
        if (active) setSearchLoading(false)
      })
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [currentUser?.uid, globalSearch])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function hasUnreadForPath(path: string) {
    if (path === '/dashboard') return dashboardUnread
    if (path === '/study-match') return studyUnread
    if (path === '/friend-requests') return friendRequestsUnread || messageRequestsUnread || groupInvitationsUnread
    if (path === '/notifications') return notificationUnread
    if (path === '/groups') return groupsUnread
    return false
  }

  useEffect(() => {
    if (!currentUser) {
      setShellProfile(null)
      return
    }

    const userRef = doc(db, 'users', currentUser.uid)
    const unsubscribe = onSnapshot(userRef, async (userSnap) => {
      const userData = userSnap.data() as { lastOpenedStudyMatchAt?: { toMillis?: () => number }; novaName?: string; online?: boolean; role?: string } | undefined
      setShellProfile({ novaName: userData?.novaName, online: userData?.online ?? false, role: userData?.role })
      const openedAt = userData?.lastOpenedStudyMatchAt?.toMillis?.() ?? 0
      try {
        const conversationSnap = await getDocs(
          query(collection(db, 'conversations'), where('participantIds', 'array-contains', currentUser.uid))
        )
        const unread = conversationSnap.docs.some((conversationDoc) => {
          const conversation = conversationDoc.data() as { type?: string; lastMessage?: { senderId?: string; timestamp?: { toMillis?: () => number } } | null }
          if (conversation.type !== 'study') return false
          const messageTime = conversation.lastMessage?.timestamp?.toMillis?.() ?? 0
          return Boolean(conversation.lastMessage && conversation.lastMessage.senderId !== currentUser.uid && messageTime > openedAt)
        })
        setStudyUnread(unread)
      } catch (error) {
        console.error('Unable to load study notifications', error)
        setStudyUnread(false)
      }
    }, (error) => {
      console.error('Unable to load study notification state', error)
      setStudyUnread(false)
    })

    return unsubscribe
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    const uid = currentUser.uid
    const unsubscribeFriendRequests = friendService.listenToRequests(uid, (data) => {
      setFriendRequestsUnread(data.received.some((request) => request.status === 'pending'))
    }, (error) => console.error('Unable to load unread friend requests', error))
    const unsubscribeMessageRequests = chatService.listenToMessageRequests(uid, (requests) => {
      setMessageRequestsUnread(requests.length > 0)
    }, (error) => console.error('Unable to load unread message requests', error))
    const unsubscribeGroupRequests = onSnapshot(
      query(collection(db, 'group_requests'), where('receiverId', '==', uid)),
      (snapshot) => setGroupInvitationsUnread(snapshot.docs.some((item) => item.data().status === 'pending')),
      (error) => console.error('Unable to load unread group invitations', error),
    )
    return () => {
      unsubscribeFriendRequests()
      unsubscribeMessageRequests()
      unsubscribeGroupRequests()
    }
  }, [currentUser?.uid])

  useEffect(() => {
    if (!currentUser) return
    const userId = currentUser.uid
    let active = true
    let requestVersion = 0
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId),
    )
    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const version = ++requestVersion
      void Promise.all(snapshot.docs.map(async (conversationDoc) => {
        const conversation = conversationDoc.data() as {
          type?: string
          groupId?: string
          messageRequestStatus?: string
          lastMessage?: { senderId?: string; timestamp?: { toMillis?: () => number } } | null
        }
        const lastMessage = conversation.lastMessage
        if (!lastMessage || lastMessage.senderId === userId) return { dashboard: false, group: false }
        if (conversation.type === 'study') return { dashboard: false, group: false }
        if (conversation.type === 'dm' && (conversation.messageRequestStatus === 'pending' || conversation.messageRequestStatus === 'declined')) return { dashboard: false, group: false }
        const participantSnapshot = await getDoc(doc(db, 'conversations', conversationDoc.id, 'participants', userId))
        const participant = participantSnapshot.data() as { lastReadTimestamp?: { toMillis?: () => number } } | undefined
        const messageAt = lastMessage.timestamp?.toMillis?.() ?? 0
        const readAt = participant?.lastReadTimestamp?.toMillis?.() ?? 0
        const unread = messageAt > readAt
        const isGroupConversation = conversation.type === 'group' || Boolean(conversation.groupId)
        return { dashboard: unread && !isGroupConversation, group: unread && isGroupConversation }
      })).then((states) => {
        if (!active || version !== requestVersion) return
        setDashboardUnread(states.some((state) => state.dashboard))
        setGroupsUnread(states.some((state) => state.group))
      }).catch((error: unknown) => {
        console.error('Unable to calculate unread chat tabs', error)
      })
    }, (error) => console.error('Unable to listen for conversations', error))
    return () => {
      active = false
      unsubscribe()
    }
  }, [currentUser?.uid, location.pathname])

  useEffect(() => {
    if (!currentUser) return
    return notificationService.listen(currentUser.uid, (items) => {
      setNotificationUnread(items.some((item) => !item.read))
      const previousIds = notificationIds.current
      notificationIds.current = new Set(items.map((item) => item.id))
      if (!previousIds || !('Notification' in window) || Notification.permission !== 'granted') return
      void getDoc(doc(db, 'users', currentUser.uid, 'settings', 'default')).then((settingsSnapshot) => {
        const settings = settingsSnapshot.data() as { notifications?: { push?: boolean } } | undefined
        if (settings?.notifications?.push === false) return
        items.filter((item) => !item.read && !previousIds.has(item.id)).forEach((item) => {
          new Notification('NovaTalk notification', { body: item.message })
        })
      })
    }, (error) => {
      console.error('Unable to load notifications', error)
      setNotificationUnread(false)
    })
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    const userId = currentUser.uid
    let active = true
    let unsubscribe: (() => void) | undefined
    const knownMessageIds = new Map<string, string>()

    async function listenForNewMessages() {
      let friendIds = new Set<string>()
      try {
        friendIds = new Set((await friendService.getFriends(userId)).map((friend) => friend.uid))
      } catch (error) {
        console.error('Unable to load friends for message alerts', error)
      }
      if (!active) return

      unsubscribe = onSnapshot(query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', userId),
      ), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const conversation = change.doc.data() as {
            type?: string
            name?: string | null
            groupId?: string
            participantIds?: string[]
            messageRequestStatus?: string
            lastMessage?: { messageId?: string; senderId?: string; previewText?: string; timestamp?: { toMillis?: () => number } } | null
          }
          const lastMessage = conversation.lastMessage
          const messageId = lastMessage?.messageId ?? `${lastMessage?.senderId ?? ''}:${lastMessage?.timestamp?.toMillis?.() ?? 0}`
          const previousMessageId = knownMessageIds.get(change.doc.id)
          knownMessageIds.set(change.doc.id, messageId)
          if (change.type === 'removed' || !previousMessageId || previousMessageId === messageId || !lastMessage || lastMessage.senderId === userId) return

          const isGroup = conversation.type === 'group' || Boolean(conversation.groupId)
          if (isGroup && conversation.groupId) {
            const title = `New message in ${conversation.name || 'your group'}`
            const toast = { id: `${change.doc.id}:${messageId}`, title, preview: lastMessage.previewText || 'Open the group to read it.', link: `/groups/${conversation.groupId}/chat` }
            setNewMessageToast(toast)
            if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
              void getDoc(doc(db, 'users', userId, 'settings', 'default')).then((settingsSnapshot) => {
                const settings = settingsSnapshot.data() as { notifications?: { push?: boolean } } | undefined
                if (active && settings?.notifications?.push !== false) new Notification(title, { body: toast.preview })
              })
            }
            return
          }

          if (conversation.type !== 'dm' || conversation.messageRequestStatus === 'pending' || conversation.messageRequestStatus === 'declined') return
          const senderId = lastMessage.senderId ?? ''
          if (conversation.messageRequestStatus !== 'accepted' && !friendIds.has(senderId)) return
          const toast = { id: `${change.doc.id}:${messageId}`, title: 'New message', preview: lastMessage.previewText || 'Open the chat to read it.', link: `/messages/${change.doc.id}` }
          setNewMessageToast(toast)
          void friendService.getUser(senderId).then((sender) => {
            if (active) setNewMessageToast((current) => current?.id === toast.id ? { ...current, title: `New message from ${sender?.novaName || 'your friend'}` } : current)
          })
          if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
            void getDoc(doc(db, 'users', userId, 'settings', 'default')).then((settingsSnapshot) => {
              const settings = settingsSnapshot.data() as { notifications?: { push?: boolean } } | undefined
              if (active && settings?.notifications?.push !== false) new Notification(toast.title, { body: toast.preview })
            })
          }
        })
      }, (error) => console.error('Unable to listen for new friend/group messages', error))
    }

    void listenForNewMessages()
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [currentUser?.uid])

  useEffect(() => {
    if (!newMessageToast) return
    const timer = window.setTimeout(() => setNewMessageToast(null), 6500)
    return () => window.clearTimeout(timer)
  }, [newMessageToast?.id])

  const isAdmin = shellProfile?.role?.toString().trim().toLowerCase() === 'admin' || shellProfile?.role?.toString().trim().toLowerCase() === 'moderator'
  const currentNavItems = [
    ...navItems,
    ...(isAdmin ? [{ label: 'Admin Panel', icon: Shield, to: '/admin' }] : []),
  ]
  const mobileNavItems = currentNavItems.slice(0, 5)

  return (
    <div className="relative min-h-screen">
      <AmbientBackdrop variant="quiet" />
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#050816]/60 backdrop-blur-xl lg:flex">
          <div className="px-6 py-6"><Logo /></div>
          <nav className="flex-1 space-y-1 px-3">
            {currentNavItems.map((item) => {
              const active = location.pathname === item.to || (item.to === '/admin' && location.pathname.startsWith('/admin'))
              const unread = hasUnreadForPath(item.to)
              return (
                <Link key={item.to} to={item.to} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${active ? 'glass text-white glow-primary' : 'text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white'} ${unread ? 'ring-1 ring-[#4F8CFF]/80 shadow-[0_0_14px_rgba(79,140,255,0.32)]' : ''}`}>
                  <item.icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/[0.06] p-4">
            <Link to="/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.05]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold text-white">{shellProfile?.novaName?.[0]?.toUpperCase() || 'U'}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{shellProfile?.novaName || 'User'}</div>
                <div className={`truncate text-xs ${shellProfile?.online ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>{shellProfile?.online ? 'Online' : 'Offline'}</div>
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
                {currentNavItems.map((item) => {
                  const unread = hasUnreadForPath(item.to)
                  const active = location.pathname === item.to || (item.to === '/admin' && location.pathname.startsWith('/admin'))
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${active ? 'glass text-white' : 'text-[#CBD5E1] hover:bg-white/[0.06] hover:text-white'} ${unread ? 'ring-1 ring-[#4F8CFF]/80 shadow-[0_0_14px_rgba(79,140,255,0.32)]' : ''}`}>
                      <item.icon size={18} />
                      {item.label}
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
              <input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setGlobalSearch('') }} placeholder="Search people and groups..." className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-10 pr-4 text-sm text-white placeholder:text-[#CBD5E1]/40 outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20" />
              {globalSearch.trim() && <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-[#101522] p-2 shadow-2xl shadow-black/40">
                {searchLoading ? <p className="px-3 py-2 text-sm text-[#CBD5E1]">Searching...</p> : searchError ? <p role="alert" className="px-3 py-2 text-sm text-red-300">{searchError}</p> : peopleResults.length === 0 && groupResults.length === 0 ? <p className="px-3 py-2 text-sm text-[#CBD5E1]">No people or groups found.</p> : <>
                  {peopleResults.length > 0 && <div className="pb-2"><p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#CBD5E1]/60">People</p>{peopleResults.slice(0, 5).map((person) => <button key={person.uid} type="button" onClick={() => { navigate('/friends', { state: { search: person.novaName || person.username } }); setGlobalSearch('') }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-xs font-semibold text-white">{person.novaName?.[0]?.toUpperCase() || '?'}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{person.novaName}</span><span className="block truncate text-xs text-[#CBD5E1]/70">@{person.username}</span></span></button>)}</div>}
                  {groupResults.length > 0 && <div className="border-t border-white/10 py-1"><p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#CBD5E1]/60">Groups</p>{groupResults.map((group) => <button key={group.id} type="button" onClick={() => { navigate('/groups', { state: { search: group.name } }); setGlobalSearch('') }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-white/[0.06]"><span className="block truncate text-sm font-medium text-white">{group.name}</span><span className="block truncate text-xs text-[#CBD5E1]/70">{group.topic}</span></button>)}</div>}
                </>}
              </div>}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link to="/notifications" className="relative rounded-xl p-2 text-[#CBD5E1] hover:bg-white/[0.06] hover:text-white"><Bell size={19} />{notificationUnread && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#EF4444]" />}</Link>
              <Link to="/profile"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-xs font-semibold text-white">{shellProfile?.novaName?.[0]?.toUpperCase() || 'U'}</div></Link>
            </div>
          </header>
          <main className="px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
        </div>
      </div>
      <nav className="glass-strong fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/[0.08] px-2 py-2 lg:hidden">
        {mobileNavItems.map((item) => {
          const active = location.pathname === item.to
          const unread = hasUnreadForPath(item.to)
          return (
            <Link key={item.to} to={item.to} className={`relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${active ? 'text-[#4F8CFF]' : 'text-[#CBD5E1]/70'} ${unread ? 'ring-1 ring-[#4F8CFF]/80 shadow-[0_0_12px_rgba(79,140,255,0.32)]' : ''}`}>
              <item.icon size={19} />
              {item.label.split(' ')[0]}
            </Link>
          )
        })}
      </nav>
      {newMessageToast && <div role="status" className="fixed right-4 top-20 z-[80] flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-[#4F8CFF]/50 bg-[#111827]/95 p-4 shadow-[0_0_22px_rgba(79,140,255,0.3)] backdrop-blur-xl">
        <MessageCircle size={19} className="mt-0.5 shrink-0 text-[#4F8CFF]" />
        <Link to={newMessageToast.link} onClick={() => setNewMessageToast(null)} className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{newMessageToast.title}</span>
          <span className="mt-1 block truncate text-sm text-[#CBD5E1]">{newMessageToast.preview}</span>
        </Link>
        <button type="button" aria-label="Dismiss message notification" onClick={() => setNewMessageToast(null)} className="text-[#CBD5E1] hover:text-white"><X size={16} /></button>
      </div>}
    </div>
  )
}
