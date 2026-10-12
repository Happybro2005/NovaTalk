import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle, Search, UserMinus, UserPlus } from 'lucide-react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { friendService, type FriendSearchUser } from '../services/friendService'
import { chatService } from '../services/chatService'
import type { User } from '../types/models'
import { db } from '../firebase'

type FriendWithPresence = User & { presenceVisible: boolean }

export default function FriendsPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<FriendWithPresence[]>([])
  const [results, setResults] = useState<FriendSearchUser[]>([])
  const [search, setSearch] = useState(() => (location.state as { search?: string } | null)?.search ?? '')
  const [loading, setLoading] = useState(true)
  const [workingUserId, setWorkingUserId] = useState<string | null>(null)
  const [openingChatUserId, setOpeningChatUserId] = useState<string | null>(null)
  const [presenceClock, setPresenceClock] = useState(Date.now())
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setPresenceClock(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  function isOnline(friend: User) {
    return friend.online && presenceClock - (friend.lastSeen?.toMillis?.() ?? 0) < 70_000
  }

  useEffect(() => {
    const initialSearch = (location.state as { search?: string } | null)?.search
    if (initialSearch) setSearch(initialSearch)
  }, [location.state])

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    let active = true
    let presenceListeners: (() => void)[] = []
    void friendService.getFriends(currentUser.uid).then(async (profiles) => {
      const friendsWithPrivacy = await Promise.all(profiles.map(async (friend) => {
        const settingsSnapshot = await getDoc(doc(db, 'users', friend.uid, 'settings', 'default')).catch(() => null)
        const privacy = (settingsSnapshot?.data() as { privacy?: { lastSeen?: 'everyone' | 'friends' | 'nobody' } } | undefined)?.privacy
        return { ...friend, presenceVisible: privacy?.lastSeen !== 'nobody' }
      }))
      if (!active) return
      setFriends(friendsWithPrivacy)
      presenceListeners = friendsWithPrivacy.flatMap((friend) => [
        onSnapshot(doc(db, 'users', friend.uid), (snapshot) => {
          if (!snapshot.exists()) return
          const profile = snapshot.data() as Partial<User>
          setFriends((current) => current.map((item) => item.uid === friend.uid ? {
            ...item,
            online: profile.online ?? false,
            lastSeen: profile.lastSeen ?? item.lastSeen,
          } : item))
        }),
        onSnapshot(doc(db, 'users', friend.uid, 'settings', 'default'), (snapshot) => {
          const privacy = (snapshot.data() as { privacy?: { lastSeen?: 'everyone' | 'friends' | 'nobody' } } | undefined)?.privacy
          setFriends((current) => current.map((item) => item.uid === friend.uid ? { ...item, presenceVisible: privacy?.lastSeen !== 'nobody' } : item))
        }),
      ])
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load friends.')
    }).finally(() => { if (active) setLoading(false) })
    return () => {
      active = false
      presenceListeners.forEach((unsubscribe) => unsubscribe())
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !search.trim()) { setResults([]); return }
    const timer = window.setTimeout(() => { void friendService.searchUsers(currentUser.uid, search).then(setResults).catch(() => setResults([])) }, 250)
    return () => window.clearTimeout(timer)
  }, [currentUser, search])

  async function toggleRequest(user: FriendSearchUser) {
    if (!currentUser) return
    setWorkingUserId(user.uid)
    setError('')
    try {
      if (user.pendingRequestId) {
        await friendService.cancelRequest(user.pendingRequestId, currentUser.uid)
        setResults((items) => items.map((item) => item.uid === user.uid ? { ...item, pendingRequestId: undefined } : item))
      } else {
        const requestId = await friendService.sendRequest(currentUser.uid, user.uid)
        setResults((items) => items.map((item) => item.uid === user.uid ? { ...item, pendingRequestId: requestId } : item))
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update friend request.')
    } finally {
      setWorkingUserId(null)
    }
  }

  async function openFriendChat(friend: User) {
    if (!currentUser) return
    setOpeningChatUserId(friend.uid)
    setError('')
    try {
      const conversationId = await chatService.openOrCreateDM(currentUser.uid, friend.uid)
      navigate(`/messages/${conversationId}`)
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : 'Unable to open this chat.')
    } finally {
      setOpeningChatUserId(null)
    }
  }

  return (
    <AppShell>
      <Eyebrow>FRIENDS</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Find your people</h1>
      <p className="mt-1 text-[#CBD5E1]">Search by NovaName or username and build your circle.</p>
      <div className="relative mt-6 max-w-xl"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#CBD5E1]/60" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search NovaName or @username" className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-3 pl-10 pr-4 text-sm text-white outline-none" /></div>

      {search.trim() && <GlassCard className="mt-5 max-w-2xl p-5"><h2 className="font-semibold text-white">People you can add</h2><div className="mt-3 space-y-2">{results.length === 0 ? <p className="text-sm text-[#CBD5E1]">No matching people found.</p> : results.map((user) => <div key={user.uid} className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-white">{user.novaName?.[0]?.toUpperCase() || '?'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{user.novaName}</p><p className="truncate text-xs text-[#CBD5E1]">@{user.username}{user.presenceVisible && ` · ${user.online ? 'Online' : 'Offline'}`}</p></div><Button size="sm" variant={user.pendingRequestId ? 'secondary' : undefined} disabled={workingUserId === user.uid} onClick={() => void toggleRequest(user)}>{user.pendingRequestId ? <><UserMinus size={15} /> Requested</> : <><UserPlus size={15} /> Add</>}</Button></div>)}</div></GlassCard>}

      {error && <p className="mt-5 text-sm text-red-300">{error}</p>}
      <div className="mt-8">{loading ? <GlassCard className="p-6 text-[#CBD5E1]">Loading your friends...</GlassCard> : friends.length === 0 ? <GlassCard className="p-6 text-[#CBD5E1]">No friends yet. Search for someone to get started.</GlassCard> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{friends.map((friend) => <GlassCard key={friend.uid} className="p-5"><div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold text-white">{friend.novaName?.[0]?.toUpperCase() || '?'}</div><div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-white">{friend.novaName}</h2><p className="truncate text-sm text-[#CBD5E1]">@{friend.username}</p>{friend.presenceVisible && <Badge className="mt-2" tone={isOnline(friend) ? 'success' : 'neutral'}>{isOnline(friend) ? 'Online now' : 'Offline'}</Badge>}</div></div><div className="mt-5 flex gap-3"><Button variant="secondary" className="flex-1" disabled={openingChatUserId === friend.uid} onClick={() => void openFriendChat(friend)}><MessageCircle size={16} /> {openingChatUserId === friend.uid ? 'Opening...' : 'Message'}</Button><Button variant="ghost" className="flex-1" onClick={async () => { if (currentUser) { await friendService.removeFriend(currentUser.uid, friend.uid); setFriends((items) => items.filter((item) => item.uid !== friend.uid)) } }}><UserMinus size={16} /> Remove</Button></div></GlassCard>)}</div>}</div>
    </AppShell>
  )
}
