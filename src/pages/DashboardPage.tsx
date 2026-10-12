import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, Send, Shuffle, Users } from 'lucide-react'
import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../firebase'
import AppShell from '../components/AppShell'
import { GlassCard, MotionGlassCard, Button, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { Conversation, User } from '../types/models'
import { chatService } from '../services/chatService'
import { friendService } from '../services/friendService'

const quickActions = [
  { label: 'Find a new friend', icon: Shuffle, to: '/study-match', tone: 'primary' as const },
  { label: 'Browse friends', icon: Users, to: '/friends', tone: 'success' as const },
]

export default function DashboardPage() {
  const { currentUser } = useAuth()
  const [recentChats, setRecentChats] = useState<{ id: string; type: string; name: string; groupId?: string; isGroup: boolean; preview: string; time: string; online: boolean; unread: boolean }[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [currentNovaName, setCurrentNovaName] = useState('')
  const [messageTarget, setMessageTarget] = useState<User | null>(null)
  const [messageDraft, setMessageDraft] = useState('')
  const [sendingMessageRequest, setSendingMessageRequest] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [messageSuccess, setMessageSuccess] = useState<{ novaName: string; username: string; status: 'pending' | 'accepted' } | null>(null)

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.uid
    
    async function fetchData() {
      try {
        const currentProfile = await getDoc(doc(db, 'users', userId))
        setCurrentNovaName((currentProfile.data() as { novaName?: string } | undefined)?.novaName ?? '')

        const usersQuery = query(collection(db, 'users'), limit(10))
        const [usersSnap, friendProfiles] = await Promise.all([
          getDocs(usersQuery),
          friendService.getFriends(userId),
        ])
        const friendIds = new Set(friendProfiles.map((friend) => friend.uid))
        const allUsersById = new Map<string, User>()
        const usersList: User[] = []
        usersSnap.forEach(docSnap => {
          const u = docSnap.data() as User
          if (u.uid && u.uid !== userId) {
            allUsersById.set(u.uid, u)
          }
          if (u.uid !== userId && !friendIds.has(u.uid)) {
            usersList.push(u)
          }
        })
        setFriends(usersList)

        const convQuery = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', userId),
        )
        const convSnap = await getDocs(convQuery)
        const convList: any[] = []
        
        for (const docSnap of [...convSnap.docs]
          .filter((docSnap) => {
            const conversation = docSnap.data() as Conversation
            if (!conversation.lastMessage) return false
            if (conversation.type === 'group' || conversation.groupId) return true
            if (conversation.type !== 'dm' || conversation.messageRequestStatus === 'pending' || conversation.messageRequestStatus === 'declined') return false
            const otherId = conversation.participantIds.find((id) => id !== userId)
            return Boolean(otherId && (friendIds.has(otherId) || conversation.messageRequestStatus === 'accepted'))
          })
          .sort((a, b) => {
          const aTime = (a.data().updatedAt?.toMillis?.() ?? 0) as number
          const bTime = (b.data().updatedAt?.toMillis?.() ?? 0) as number
          return bTime - aTime
          }).slice(0, 5)) {
          const conv = docSnap.data() as Conversation
           const isGroup = conv.type === 'group' || Boolean(conv.groupId)
           const otherId = conv.participantIds.find(id => id !== currentUser?.uid)
           let chatName = conv.name || 'Unknown'

           if (!isGroup && otherId) {
            const otherUserDoc = allUsersById.get(otherId) ?? friendProfiles.find((friend) => friend.uid === otherId)
            chatName = otherUserDoc?.novaName || otherUserDoc?.displayName || otherUserDoc?.username || 'User'
           }

          const participantSnapshot = await getDoc(doc(db, 'conversations', docSnap.id, 'participants', userId))
          const participantData = participantSnapshot.data() as { lastReadTimestamp?: { toMillis?: () => number } } | undefined
          const lastMessageAt = conv.lastMessage?.timestamp?.toMillis?.() ?? 0
          const lastReadAt = participantData?.lastReadTimestamp?.toMillis?.() ?? 0

          convList.push({
            id: docSnap.id,
            type: conv.type,
            name: chatName,
            groupId: conv.groupId,
            isGroup,
            preview: conv.lastMessage?.previewText || 'Started a conversation',
            time: 'Recently',
            online: false,
            unread: Boolean(conv.lastMessage?.senderId !== userId && lastMessageAt > lastReadAt),
          })
        }
        setRecentChats(convList)
      } catch (err) {
        console.error("Error fetching dashboard data", err)
      }
    }
    fetchData()
  }, [currentUser])

  async function sendMessageRequest() {
    if (!currentUser || !messageTarget || !messageDraft.trim()) return
    try {
      setSendingMessageRequest(true)
      setMessageError('')
      const result = await chatService.sendMessageRequest(currentUser.uid, messageTarget.uid, messageDraft, currentNovaName)
      setMessageSuccess({ novaName: messageTarget.novaName, username: messageTarget.username, status: result.status })
      setMessageTarget(null)
      setMessageDraft('')
    } catch (error) {
      setMessageError(error instanceof Error ? error.message : 'Unable to send the message request.')
    } finally {
      setSendingMessageRequest(false)
    }
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Eyebrow>DASHBOARD</Eyebrow>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome back, {currentNovaName || 'User'}
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
                  <Link key={c.id} to={c.isGroup && c.groupId ? `/groups/${c.groupId}/chat` : c.type === 'dm' ? `/messages/${c.id}` : '/study-match'} className={`flex items-center gap-3 rounded-xl p-2.5 transition ${c.unread ? 'bg-[#4F8CFF]/[0.08] ring-1 ring-[#4F8CFF]/70 shadow-[0_0_18px_rgba(79,140,255,0.22)]' : 'hover:bg-white/[0.05]'}`}>
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold">
                        {c.isGroup ? 'G' : c.name[0]?.toUpperCase()}
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
                    {c.unread && <span aria-label="Unread message" className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#4F8CFF] shadow-[0_0_10px_rgba(79,140,255,0.8)]" />}
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
                      {f.novaName ? f.novaName[0].toUpperCase() : '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{f.novaName}</div>
                      <div className="truncate text-xs text-[#CBD5E1]/60">@{f.username}</div>
                    </div>
                    <Button size="sm" variant="secondary" className="shrink-0 !px-3" onClick={() => { setMessageTarget(f); setMessageDraft(''); setMessageError(''); setMessageSuccess(null) }}>Message</Button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {messageTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="message-request-title">
        <GlassCard strong className="w-full max-w-lg p-6">
          <h2 id="message-request-title" className="text-xl font-semibold text-white">Message {messageTarget.novaName}</h2>
          <p className="mt-2 text-sm text-[#CBD5E1]">Send one message request. You can continue chatting if they accept.</p>
          {messageError && <p role="alert" className="mt-4 text-sm text-red-300">{messageError}</p>}
          <textarea value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} maxLength={500} rows={4} autoFocus className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] p-3 text-sm text-white outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20" placeholder="Write your first message..." />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" disabled={sendingMessageRequest} onClick={() => setMessageTarget(null)}>Cancel</Button>
            <Button disabled={sendingMessageRequest || !messageDraft.trim()} onClick={() => void sendMessageRequest()}><Send size={16} /> {sendingMessageRequest ? 'Sending...' : 'Send request'}</Button>
          </div>
        </GlassCard>
      </div>}

      {messageSuccess && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="message-success-title">
        <motion.div initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111522] p-7 text-center shadow-2xl shadow-black/50">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <motion.span initial={{ scale: 0.7, opacity: 0.7 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.75, ease: 'easeOut' }} className="absolute inset-0 rounded-full border-2 border-emerald-400" />
            <motion.div initial={{ scale: 0, rotate: -35 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 14, delay: 0.08 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400 text-[#07130F] shadow-lg shadow-emerald-400/25">
              <Check size={34} strokeWidth={3} />
            </motion.div>
          </div>
          <h2 id="message-success-title" className="mt-5 text-xl font-semibold text-white">{messageSuccess.status === 'pending' ? 'Request sent' : 'Message sent'}</h2>
          <p className="mt-2 text-sm text-[#CBD5E1]">{messageSuccess.status === 'pending'
            ? `Your message is waiting in Msg request for ${messageSuccess.novaName} (@${messageSuccess.username}). They can accept or decline it.`
            : `You are already connected. Your message was sent to ${messageSuccess.novaName}.`}</p>
          <Button className="mt-6 w-full" onClick={() => setMessageSuccess(null)}>Done</Button>
        </motion.div>
      </div>}
    </AppShell>
  )
}
