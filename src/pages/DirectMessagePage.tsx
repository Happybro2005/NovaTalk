import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import AppShell from '../components/AppShell'
import { Button, GlassCard, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { chatService } from '../services/chatService'
import { db } from '../firebase'
import { userService } from '../services/userService'
import type { Conversation, User } from '../types/models'

type ChatMessage = { id: string; senderId: string; senderNovaName: string; text: string; createdAt: number }

export default function DirectMessagePage() {
  const { conversationId } = useParams()
  const { currentUser } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [currentNovaName, setCurrentNovaName] = useState('NovaTalk member')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState<boolean | null>(null)
  const [otherReadAt, setOtherReadAt] = useState(0)
  const lastMarkedMessageId = useRef<string | null>(null)

  useEffect(() => {
    if (!currentUser) return
    return onSnapshot(doc(db, 'users', currentUser.uid, 'settings', 'default'), (snapshot) => {
      const settings = snapshot.data() as { privacy?: { readReceipts?: boolean } } | undefined
      setReadReceiptsEnabled(settings?.privacy?.readReceipts !== false)
    }, () => setReadReceiptsEnabled(false))
  }, [currentUser?.uid])

  useEffect(() => {
    if (!currentUser) return
    void userService.getUserProfile(currentUser.uid).then((profile) => {
      setCurrentNovaName(profile?.novaName || 'NovaTalk member')
    })
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !conversationId) return
    let active = true
    setLoading(true)
    void getDoc(doc(db, 'conversations', conversationId)).then(async (snapshot) => {
      if (!active) return
      if (!snapshot.exists()) {
        setError('This conversation could not be found.')
        setLoading(false)
        return
      }
      const loadedConversation = { id: snapshot.id, ...(snapshot.data() as Omit<Conversation, 'id'>) }
      if (loadedConversation.type !== 'dm' || !loadedConversation.participantIds.includes(currentUser.uid)) {
        setError('You do not have access to this conversation.')
        setLoading(false)
        return
      }
      setConversation(loadedConversation)
      const otherUserId = loadedConversation.participantIds.find((id) => id !== currentUser.uid)
      if (otherUserId) {
        const profile = await userService.getUserProfile(otherUserId)
        if (active) setOtherUser(profile)
      }
      setLoading(false)
    }).catch((loadError: unknown) => {
      if (!active) return
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this conversation.')
      setLoading(false)
    })
    return () => { active = false }
  }, [conversationId, currentUser])

  const otherParticipantId = conversation?.participantIds?.find((id) => id !== currentUser?.uid)
  const isDeletedUser = !loading && Boolean(otherParticipantId) && !otherUser
  const canChat = Boolean(conversation && !isDeletedUser && conversation.messageRequestStatus !== 'pending' && conversation.messageRequestStatus !== 'declined')

  useEffect(() => {
    if (!conversationId || !currentUser || (!canChat && !isDeletedUser) || readReceiptsEnabled === null) return
    lastMarkedMessageId.current = null
    return chatService.listenToMessages(conversationId, (items) => {
      setMessages(items)
      const latestIncoming = [...items].reverse().find((item) => item.senderId !== currentUser.uid)
      if (readReceiptsEnabled && latestIncoming && lastMarkedMessageId.current !== latestIncoming.id) {
        lastMarkedMessageId.current = latestIncoming.id
        void chatService.markConversationRead(conversationId, currentUser.uid).catch((readError: unknown) => {
          console.error('Unable to mark direct message as read', readError)
        })
      }
    }, (listenError) => {
      setError(listenError.message || 'Unable to load messages.')
    })
  }, [conversationId, currentUser?.uid, canChat, isDeletedUser, readReceiptsEnabled])

  useEffect(() => {
    const otherUserId = conversation?.participantIds.find((id) => id !== currentUser?.uid)
    if (!conversationId || !currentUser || !canChat || !otherUserId) return
    return chatService.listenToParticipantRead(conversationId, otherUserId, setOtherReadAt, (readError) => {
      setError(readError.message || 'Unable to load read receipt state.')
    })
  }, [conversationId, conversation?.participantIds, currentUser?.uid, canChat])

  const outgoingMessages = messages.filter((item) => item.senderId === currentUser?.uid)
  const latestOutgoingMessage = outgoingMessages[outgoingMessages.length - 1]

  async function sendMessage() {
    const trimmed = message.trim()
    if (!currentUser || !conversationId || !canChat || !trimmed || sending) return
    try {
      setSending(true)
      setError('')
      await chatService.sendMessage(conversationId, currentUser.uid, trimmed, 'text', currentNovaName)
      setMessage('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send your message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100dvh-11rem)] min-h-[440px] w-full max-w-4xl flex-col">
        <div className="flex shrink-0 items-center gap-3">
          <Link to="/dashboard" aria-label="Back to dashboard" className="rounded-lg p-2 text-[#CBD5E1] hover:bg-white/[0.06] hover:text-white"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              {otherUser?.novaName || (isDeletedUser ? 'Deleted User' : 'Direct message')}
              {isDeletedUser && (
                <span className="rounded px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                  Deleted User
                </span>
              )}
            </h1>
            {otherUser?.username && <p className="text-sm text-[#CBD5E1]">@{otherUser.username}</p>}
          </div>
        </div>

        {error && <p role="alert" className="mt-4 shrink-0 text-sm text-red-300">{error}</p>}

        <GlassCard strong className="mt-5 flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          {loading ? <p className="text-sm text-[#CBD5E1]">Loading conversation...</p> : conversation?.messageRequestStatus === 'pending' ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <h2 className="text-lg font-semibold text-white">Message request sent</h2>
              <p className="mt-2 max-w-sm text-sm text-[#CBD5E1]">You can continue chatting after {conversation.messageRequestTo === currentUser?.uid ? 'you accept this request' : 'they accept your request'}.</p>
              <Link to="/friend-requests" className="mt-5"><Button variant="secondary">View requests</Button></Link>
            </div>
          ) : conversation?.messageRequestStatus === 'declined' ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <h2 className="text-lg font-semibold text-white">This message request was declined</h2>
              <Link to="/dashboard" className="mt-5"><Button variant="secondary">Back to dashboard</Button></Link>
            </div>
          ) : !conversation ? (
            <p className="text-sm text-[#CBD5E1]">Conversation unavailable.</p>
          ) : (
            <>
              <div
                data-chat-container="true"
                data-chat-id={conversationId || ''}
                data-chat-name={otherUser?.novaName || 'Direct Message'}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4"
              >
                {messages.length === 0 ? <p className="text-sm text-[#CBD5E1]">No messages yet. Say hello.</p> : messages.map((item) => (
                  <div key={item.id} className={`flex w-full ${item.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div
                      data-message-bubble="true"
                      data-message-id={item.id}
                      data-message-text={item.text}
                      data-message-sender-id={item.senderId}
                      data-message-sender-name={item.senderId === currentUser?.uid ? 'You' : (otherUser ? item.senderNovaName : 'Deleted User')}
                      data-chat-id={conversationId || ''}
                      data-chat-name={otherUser?.novaName || 'Direct Message'}
                      className={`w-fit max-w-[50%] rounded-xl p-3 text-sm text-white ${item.senderId === currentUser?.uid ? 'bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED]' : 'bg-white/[0.06]'}`}
                    >
                      <p className="mb-1 text-xs font-semibold text-[#BFDBFE]">{item.senderId === currentUser?.uid ? 'You' : (otherUser ? item.senderNovaName : 'Deleted User')}</p>
                      <p className="break-words">{item.text}</p>
                      {item.id === latestOutgoingMessage?.id && otherReadAt >= item.createdAt && item.createdAt > 0 && <p className="mt-1 text-right text-[10px] text-[#BFDBFE]/70">Seen</p>}
                    </div>
                  </div>
                ))}
              </div>
              {isDeletedUser ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center text-sm text-[#CBD5E1]">
                  This user's account has been deleted. You can view previous messages, but new messages cannot be sent.
                </div>
              ) : (
                <div className="mt-4 flex shrink-0 gap-3">
                  <Input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void sendMessage() }} placeholder="Write a message..." />
                  <Button disabled={sending || !message.trim()} onClick={() => void sendMessage()}><Send size={16} /> Send</Button>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>
    </AppShell>
  )
}