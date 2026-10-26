import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, Loader2, Radar, Send, SkipForward, UserPlus } from 'lucide-react'
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Input, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { matchmakingService } from '../services/matchmakingService'
import { chatService } from '../services/chatService'
import { friendService } from '../services/friendService'
import { db } from '../firebase'
import type { User } from '../types/models'

export default function StrangerChatPage() {
  const { currentUser } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ id: string; senderId: string; text: string; createdAt: number; edited?: boolean; deleted?: boolean; pinned?: boolean; highlighted?: boolean }[]>([])
  const [messageMenu, setMessageMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [matchError, setMatchError] = useState('')
  const [actionError, setActionError] = useState('')
  const [queueNotice, setQueueNotice] = useState('')
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null)
  const [matchedUser, setMatchedUser] = useState<User | null>(null)
  const [friendRequestSent, setFriendRequestSent] = useState(false)
  const [discoveryEnabled, setDiscoveryEnabled] = useState<boolean | null>(null)
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState<boolean | null>(null)
  const [matchedUserReadAt, setMatchedUserReadAt] = useState(0)
  const isSearchingRef = useRef(false)
  const skippingRef = useRef(false)
  const activeConversationIdRef = useRef<string | null>(null)
  const skipMatchedFriendRef = useRef<() => void>(() => undefined)
  const skipCooldownsRef = useRef(new Map<string, ReturnType<typeof window.setTimeout>>())
  const excludedUsersRef = useRef<Record<string, number>>({})
  const handledSkipEventsRef = useRef(new Set<string>())
  const ignoredConversationIdsRef = useRef(new Set<string>())
  const lastReadMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!currentUser) return
    return onSnapshot(doc(db, 'users', currentUser.uid, 'settings', 'default'), (snapshot) => {
      const settings = snapshot.data() as { privacy?: { readReceipts?: boolean } } | undefined
      setReadReceiptsEnabled(settings?.privacy?.readReceipts !== false)
    }, () => setReadReceiptsEnabled(false))
  }, [currentUser?.uid])

  useEffect(() => {
    if (!currentUser) return
    return onSnapshot(doc(db, 'users', currentUser.uid, 'settings', 'default'), (snapshot) => {
      const settings = snapshot.data() as { privacy?: { studyMatch?: boolean } } | undefined
      setDiscoveryEnabled(settings?.privacy?.studyMatch !== false)
    }, (error) => {
      setMatchError(error.message || 'Unable to load friend discovery settings.')
      setDiscoveryEnabled(false)
    })
  }, [currentUser?.uid])

  useEffect(() => {
    const userId = currentUser?.uid ?? ''
    if (!userId || discoveryEnabled === null) return

    if (!discoveryEnabled) {
      isSearchingRef.current = false
      void matchmakingService.leaveStudyQueue(userId)
      if (!activeConversationIdRef.current) {
        setMatchError('Friend discovery is disabled in Settings. Enable it to find new friends.')
        setLoading(false)
      }
      return
    }
    if (activeConversationIdRef.current) return

    let active = true
    let intervalId: ReturnType<typeof window.setInterval> | null = null
    let heartbeatId: ReturnType<typeof window.setInterval> | null = null
    const matchStartedAt = Date.now()
    isSearchingRef.current = false
    setMatchError('')

    async function startMatchmaking() {
      if (!active) return

      setLoading(true)
      isSearchingRef.current = true
      await updateDoc(doc(db, 'users', userId), {
        lastOpenedStudyMatchAt: serverTimestamp(),
      })
      await matchmakingService.joinStudyQueue(userId)

      heartbeatId = window.setInterval(() => {
        if (isSearchingRef.current) void matchmakingService.refreshQueue(userId)
      }, 20_000)

      intervalId = window.setInterval(async () => {
        if (!isSearchingRef.current) return
        const now = Date.now()
        const excludedUserIds = Object.entries(excludedUsersRef.current)
          .filter(([, skipUntil]) => skipUntil > now)
          .map(([excludedUserId]) => excludedUserId)
        const matchId = await matchmakingService.findMatch(userId, excludedUserIds)
        if (matchId && active && isSearchingRef.current) {
          isSearchingRef.current = false
          activeConversationIdRef.current = matchId
          setConversationId(matchId)
          setLoading(false)
        }
      }, 2500)

      const conversationQuery = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', userId)
      )

      return onSnapshot(conversationQuery, (snap) => {
        const matchedConversation = snap.docs.find((conversationDoc) => {
          const data = conversationDoc.data() as { type?: string; createdAt?: { toMillis?: () => number } }
          if (data.type !== 'study') return false
          if (ignoredConversationIdsRef.current.has(conversationDoc.id)) return false
          return (data.createdAt?.toMillis?.() ?? 0) >= matchStartedAt
        })
        if (matchedConversation && active) {
          isSearchingRef.current = false
          activeConversationIdRef.current = matchedConversation.id
          setConversationId(matchedConversation.id)
          setLoading(false)
        }
      })
    }

    let unsubscribeConversation: (() => void) | undefined
    startMatchmaking().then((unsubscribe) => {
      unsubscribeConversation = unsubscribe
    })

    return () => {
      active = false
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (heartbeatId) clearInterval(heartbeatId)
      void matchmakingService.leaveStudyQueue(userId)
      unsubscribeConversation?.()
    }
  }, [currentUser?.uid, discoveryEnabled])

  useEffect(() => () => {
    skipCooldownsRef.current.forEach((timer) => window.clearTimeout(timer))
    skipCooldownsRef.current.clear()
  }, [])

  useEffect(() => {
    activeConversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    const userId = currentUser?.uid
    return () => {
      const activeConversationId = activeConversationIdRef.current
      if (userId && activeConversationId) {
        void matchmakingService.skipMatch(activeConversationId, userId).catch(() => undefined)
      }
    }
  }, [currentUser?.uid])

  useEffect(() => {
    if (!conversationId || !currentUser) return
    let active = true
    void getDoc(doc(db, 'conversations', conversationId)).then((snapshot) => {
      if (!active || !snapshot.exists()) return
      const participantIds = (snapshot.data().participantIds as string[] | undefined) ?? []
      const otherUserId = participantIds.find((participantId) => participantId !== currentUser.uid) ?? null
      setMatchedUserId(otherUserId)
      setMatchedUser(null)
      setMatchedUserReadAt(0)
      if (otherUserId) {
        void friendService.getUser(otherUserId).then((profile) => {
          if (active) setMatchedUser(profile)
        })
      }
      setFriendRequestSent(false)
      setActionError('')
      setQueueNotice('')
    })
    return () => { active = false }
  }, [conversationId, currentUser])

  useEffect(() => {
    if (!conversationId || !matchedUserId) return
    const handleLeaveTab = () => {
      if (document.visibilityState === 'hidden') skipMatchedFriendRef.current()
    }
    document.addEventListener('visibilitychange', handleLeaveTab)
    window.addEventListener('pagehide', handleLeaveTab)
    return () => {
      document.removeEventListener('visibilitychange', handleLeaveTab)
      window.removeEventListener('pagehide', handleLeaveTab)
    }
  }, [conversationId, matchedUserId])

  useEffect(() => {
    if (!conversationId || !currentUser) return
    let active = true
    const conversationRef = doc(db, 'conversations', conversationId)
    const handleSkipUpdate = (data: { skippedBy?: string; skipEventId?: string; skipUntil?: number } | undefined) => {
      if (!active || !data) return
      if (!data.skippedBy || !data.skipEventId || data.skippedBy === currentUser.uid || handledSkipEventsRef.current.has(data.skipEventId)) return
      handledSkipEventsRef.current.add(data.skipEventId)
      ignoredConversationIdsRef.current.add(conversationId)
      activeConversationIdRef.current = null
      temporarilyExclude(data.skippedBy, data.skipUntil ?? 0)
      isSearchingRef.current = true
      setConversationId(null)
      setMatchedUserId(null)
      setMatchedUser(null)
      setFriendRequestSent(false)
      setMessages([])
      setMessage('')
      setLoading(true)
      setActionError('')
      setQueueNotice('Finding you someone new...')
      if (!discoveryEnabled) {
        isSearchingRef.current = false
        setMatchError('Friend discovery is disabled in Settings. Enable it to continue matching.')
        setLoading(false)
        return
      }
      void matchmakingService.joinStudyQueue(currentUser.uid).catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : 'Unable to rejoin the friend queue.')
      })
    }
    const unsubscribe = onSnapshot(conversationRef, (snapshot) => {
      handleSkipUpdate(snapshot.data() as { skippedBy?: string; skipEventId?: string; skipUntil?: number } | undefined)
    }, (error) => {
      setActionError(error.message || 'Unable to listen for match updates.')
    })
    const checkForSkip = () => {
      void getDoc(conversationRef).then((snapshot) => {
        handleSkipUpdate(snapshot.data() as { skippedBy?: string; skipEventId?: string; skipUntil?: number } | undefined)
      }).catch((error: unknown) => {
        if (active) setActionError(error instanceof Error ? error.message : 'Unable to refresh this conversation.')
      })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForSkip()
    }
    window.addEventListener('focus', checkForSkip)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const skipCheckInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') checkForSkip()
    }, 2000)
    return () => {
      active = false
      unsubscribe()
      window.clearInterval(skipCheckInterval)
      window.removeEventListener('focus', checkForSkip)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [conversationId, currentUser, discoveryEnabled])

  function temporarilyExclude(userId: string, skipUntil: number) {
    const remainingMs = skipUntil - Date.now()
    if (remainingMs <= 0) return
    const previousTimer = skipCooldownsRef.current.get(userId)
    if (previousTimer) window.clearTimeout(previousTimer)
    excludedUsersRef.current[userId] = skipUntil
    const timer = window.setTimeout(() => {
      delete excludedUsersRef.current[userId]
      skipCooldownsRef.current.delete(userId)
    }, remainingMs)
    skipCooldownsRef.current.set(userId, timer)
  }

  useEffect(() => {
    if (!conversationId || !currentUser || readReceiptsEnabled === null) return
    let active = true
    lastReadMessageIdRef.current = null
    const unsubscribe = chatService.listenToMessages(conversationId, (items) => {
      if (!active) return
      setMessages(items)
      const latestIncoming = [...items].reverse().find((item) => item.senderId !== currentUser.uid)
      if (readReceiptsEnabled && latestIncoming && lastReadMessageIdRef.current !== latestIncoming.id) {
        lastReadMessageIdRef.current = latestIncoming.id
        void chatService.markConversationRead(conversationId, currentUser.uid).catch((readError: unknown) => {
          console.error('Unable to mark friend-match message as read', readError)
        })
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [conversationId, currentUser?.uid, readReceiptsEnabled])

  useEffect(() => {
    if (!conversationId || !matchedUserId || readReceiptsEnabled === false) return
    return chatService.listenToParticipantRead(conversationId, matchedUserId, setMatchedUserReadAt)
  }, [conversationId, matchedUserId, readReceiptsEnabled])

  async function sendMessage() {
    if (!currentUser || !conversationId || !message.trim()) return
    if (editingMessageId) {
      await chatService.editMessage(conversationId, editingMessageId, message)
      setEditingMessageId(null)
    } else {
      await chatService.sendMessage(conversationId, currentUser.uid, message.trim())
    }
    setMessage('')
  }

  async function addMatchedFriend() {
    if (!currentUser || !matchedUserId) return
    try {
      setActionError('')
      await friendService.sendRequest(currentUser.uid, matchedUserId)
      setFriendRequestSent(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to send friend request.')
    }
  }

  async function skipMatchedFriend() {
    if (!currentUser || !conversationId || !matchedUserId || skippingRef.current) return
    skippingRef.current = true
    activeConversationIdRef.current = null
    try {
      setActionError('')
      const { skipUntil } = await matchmakingService.skipMatch(conversationId, currentUser.uid)
      ignoredConversationIdsRef.current.add(conversationId)
      activeConversationIdRef.current = null
      temporarilyExclude(matchedUserId, skipUntil)
      isSearchingRef.current = true
      setConversationId(null)
      setMatchedUserId(null)
      setMatchedUser(null)
      setFriendRequestSent(false)
      setMessages([])
      setMessage('')
      setLoading(true)
      setQueueNotice('Finding you someone new...')
      if (discoveryEnabled) {
        await matchmakingService.joinStudyQueue(currentUser.uid)
      } else {
        setMatchError('Friend discovery is disabled in Settings. Enable it to continue matching.')
        setLoading(false)
      }
    } catch (error) {
      activeConversationIdRef.current = conversationId
      setActionError(error instanceof Error ? error.message : 'Unable to skip this person.')
    } finally {
      skippingRef.current = false
    }
  }

  skipMatchedFriendRef.current = () => { void skipMatchedFriend() }

  async function handleMessageAction(action: 'edit' | 'delete' | 'pinned' | 'highlighted') {
    if (!conversationId || !messageMenu || !currentUser) return
    const selectedMessage = messages.find((item) => item.id === messageMenu.id)
    if (!selectedMessage) return
    try {
      if (action === 'edit') {
        setEditingMessageId(selectedMessage.id)
        setMessage(selectedMessage.text)
      } else if (action === 'delete') {
        if (!window.confirm('Delete this message for everyone?')) return
        await chatService.deleteMessage(conversationId, selectedMessage.id)
      } else {
        await chatService.toggleMessageFlag(conversationId, selectedMessage.id, action, !selectedMessage[action])
      }
    } finally {
      setMessageMenu(null)
    }
  }

  const outgoingMessages = messages.filter((item) => item.senderId === currentUser?.uid)
  const latestOutgoingMessage = outgoingMessages[outgoingMessages.length - 1]

  return (
    <AppShell>
      <Eyebrow>NEW FRIENDS</Eyebrow>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Meet a new friend, live.</h1>
          <p className="mt-1 text-[#CBD5E1]">Meet someone new, share a moment, and see where the conversation goes.</p>
        </div>
        <Badge tone={loading ? 'warning' : 'success'}>{loading ? 'Finding partner' : 'Matched'}</Badge>
      </div>

      {actionError && <p role="alert" className="mt-4 text-sm text-red-300">{actionError}</p>}
      {queueNotice && loading && <p role="status" className="mt-4 text-sm text-[#CBD5E1]">{queueNotice}</p>}

      <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <GlassCard strong className="min-h-[420px] p-6">
          {matchError ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <h2 className="text-xl font-semibold text-white">Friend discovery is off</h2>
              <p className="mt-2 max-w-md text-sm text-[#CBD5E1]">{matchError}</p>
              <Link to="/settings" className="mt-6"><Button variant="secondary">Open Settings</Button></Link>
            </div>
          ) : loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#4F8CFF]/30 bg-[#4F8CFF]/10 text-[#4F8CFF]">
                <Radar size={42} className="animate-pulse" />
                <span className="absolute inset-0 animate-ping rounded-full border border-[#4F8CFF]/30" />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-white">Finding a new friend...</h2>
              <p className="mt-2 max-w-md text-sm text-[#CBD5E1]">A live conversation will open as soon as the best available friend match is found.</p>
              <Button className="mt-6" variant="secondary" disabled>
                <Loader2 size={16} className="animate-spin" /> Waiting in queue
              </Button>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-white">Live chat</h2>
                  <p className="text-xs text-[#CBD5E1]">Conversation {conversationId}</p>
                </div>
                <Link className="text-sm text-[#4F8CFF] hover:underline" to="/dashboard">Back to dashboard</Link>
              </div>
              <div
                data-chat-container="true"
                data-chat-id={conversationId || ''}
                data-chat-name="Stranger Chat"
                className="flex-1 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                {messages.length === 0 ? (
                  <p className="text-sm text-[#CBD5E1]">No messages yet. Say hello.</p>
                ) : (
                  messages.map((msg) => (
                      <div key={msg.id} className={`flex w-full ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                        <div
                          data-message-bubble="true"
                          data-message-id={msg.id}
                          data-message-text={msg.text}
                          data-message-sender-id={msg.senderId}
                          data-message-sender-name={msg.senderId === currentUser?.uid ? 'You' : (matchedUser?.novaName || 'Stranger')}
                          data-is-self={msg.senderId === currentUser?.uid ? 'true' : 'false'}
                          data-chat-id={conversationId || ''}
                          data-chat-name="Stranger Chat"
                          onContextMenu={(event) => { event.preventDefault(); setMessageMenu({ id: msg.id, x: event.clientX, y: event.clientY }) }}
                          className={`w-fit max-w-[50%] rounded-xl bg-white/[0.05] p-3 text-sm text-white ${msg.highlighted ? 'ring-2 ring-[#F59E0B]' : ''}`}
                        >
                          {msg.text} {msg.edited && !msg.deleted && <span className="text-xs text-[#CBD5E1]">(edited)</span>}
                          {msg.id === latestOutgoingMessage?.id && matchedUserReadAt >= msg.createdAt && msg.createdAt > 0 && <div className="mt-1 text-right text-[10px] text-[#BFDBFE]/70">Seen</div>}
                          {msg.pinned && <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[#FCD34D]">Pinned</div>}
                        </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message..." />
                {editingMessageId && <Button type="button" variant="ghost" onClick={() => { setEditingMessageId(null); setMessage('') }}>Cancel</Button>}
                <Button type="button" onClick={sendMessage}><Send size={16} /> {editingMessageId ? 'Save' : 'Send'}</Button>
              </div>
            </div>
          )}
        </GlassCard>

        {conversationId && matchedUserId ? (
          <GlassCard className="flex min-h-[420px] flex-col p-6">
            <div>
              <Eyebrow>CURRENT MATCH</Eyebrow>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-lg font-semibold text-white">
                  {matchedUser?.novaName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-white">{matchedUser?.novaName || 'NovaTalk member'}</h2>
                  {matchedUser?.username && <p className="truncate text-sm text-[#CBD5E1]">@{matchedUser.username}</p>}
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" />Connected</div>
            </div>
            <div className="mt-auto grid gap-3 pt-8">
              <Button variant="secondary" onClick={() => void addMatchedFriend()} disabled={friendRequestSent}>
                <UserPlus size={16} /> {friendRequestSent ? 'Requested' : 'Add friend'}
              </Button>
              <Button variant="ghost" onClick={() => void skipMatchedFriend()}><SkipForward size={16} /> Skip this person</Button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex min-h-[420px] flex-col items-center justify-center p-6 text-center">
            {matchError ? <>
              <h2 className="text-lg font-semibold text-white">Friend discovery is off</h2>
              <p className="mt-2 max-w-xs text-sm text-[#CBD5E1]">Enable friend discovery in Settings to start matching.</p>
              <Link to="/settings" className="mt-5"><Button variant="secondary">Open Settings</Button></Link>
            </> : <>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#4F8CFF]/30 bg-[#4F8CFF]/10 text-[#4F8CFF]">
                <Radar size={32} className="animate-pulse" />
                <span className="absolute inset-0 animate-ping rounded-full border border-[#4F8CFF]/20" />
              </div>
              <h2 className="mt-6 text-lg font-semibold text-white">Looking for a match</h2>
              <p className="mt-2 max-w-xs text-sm text-[#CBD5E1]">Your next conversation will appear here when someone is found.</p>
              <Badge className="mt-5" tone="warning">Queue active</Badge>
            </>}
          </GlassCard>
        )}
      </div>

      {messageMenu && <div className="fixed z-[70] w-48 rounded-xl border border-white/10 bg-[#111827] p-1.5 shadow-2xl shadow-black/40" style={{ left: Math.min(messageMenu.x, window.innerWidth - 208), top: Math.min(messageMenu.y, window.innerHeight - 220) }} onMouseLeave={() => setMessageMenu(null)}>
        {(() => { const selectedMessage = messages.find((item) => item.id === messageMenu.id); if (!selectedMessage) return null; const isMine = selectedMessage.senderId === currentUser?.uid; return <>
          {isMine && !selectedMessage.deleted && <button type="button" onClick={() => void handleMessageAction('edit')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#E2E8F0] hover:bg-white/10">Edit</button>}
          {isMine && !selectedMessage.deleted && <button type="button" onClick={() => void handleMessageAction('delete')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#FCA5A5] hover:bg-white/10">Delete</button>}
          <button type="button" onClick={() => void handleMessageAction('pinned')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#E2E8F0] hover:bg-white/10">{selectedMessage.pinned ? 'Unpin' : 'Pin'}</button>
          <button type="button" onClick={() => void handleMessageAction('highlighted')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#E2E8F0] hover:bg-white/10">{selectedMessage.highlighted ? 'Remove highlight' : 'Highlight'}</button>
          {!isMine && (
            <>
              <div className="my-1 border-t border-white/10" />
              <button
                type="button"
                onClick={() => {
                  setMessageMenu(null)
                  window.dispatchEvent(
                    new CustomEvent('novatalk:open-report', {
                      detail: {
                        type: 'message',
                        targetId: selectedMessage.id,
                        senderId: selectedMessage.senderId || matchedUser?.uid,
                        reportedUserId: selectedMessage.senderId || matchedUser?.uid,
                        senderName: matchedUser?.novaName || 'Stranger',
                        reportedUserName: matchedUser?.novaName || 'Stranger',
                        text: selectedMessage.text,
                        chatName: 'Stranger Chat',
                      },
                    })
                  )
                }}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
              >
                <Flag size={14} /> Report Message
              </button>
            </>
          )}
        </> })()}
      </div>}

    </AppShell>
  )
}
