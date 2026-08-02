import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Radar, Send } from 'lucide-react'
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Input, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { matchmakingService } from '../services/matchmakingService'
import { chatService } from '../services/chatService'
import { db } from '../firebase'

export default function StrangerChatPage() {
  const { currentUser } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([])

  useEffect(() => {
    const userId = currentUser?.uid ?? ''
    if (!userId) return

    let active = true
    let intervalId: ReturnType<typeof window.setInterval> | null = null

    async function startMatchmaking() {
      setLoading(true)
      await updateDoc(doc(db, 'users', userId), {
        lastOpenedStrangerChatAt: serverTimestamp(),
      })
      await matchmakingService.joinStrangerQueue(userId)

      intervalId = window.setInterval(async () => {
        const matchId = await matchmakingService.findMatch(userId)
        if (matchId && active) {
          setConversationId(matchId)
          setLoading(false)
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        }
      }, 2500)

      const conversationQuery = query(
        collection(db, 'conversations'),
        where('type', '==', 'stranger'),
        where('participantIds', 'array-contains', userId)
      )

      return onSnapshot(conversationQuery, (snap) => {
        const matchedConversation = snap.docs[0]
        if (matchedConversation && active) {
          setConversationId(matchedConversation.id)
          setLoading(false)
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
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
      void matchmakingService.leaveStrangerQueue(userId)
      unsubscribeConversation?.()
    }
  }, [currentUser?.uid])

  async function sendMessage() {
    if (!currentUser || !conversationId || !message.trim()) return
    await chatService.sendMessage(conversationId, currentUser.uid, message.trim())
    setMessages((current) => [...current, { id: `${Date.now()}`, text: message.trim() }])
    setMessage('')
  }

  return (
    <AppShell>
      <Eyebrow>STRANGER CHAT</Eyebrow>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Random encounters, live.</h1>
          <p className="mt-1 text-[#CBD5E1]">We are matching you with someone available right now.</p>
        </div>
        <Badge tone={loading ? 'warning' : 'success'}>{loading ? 'Finding match' : 'Matched'}</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard strong className="p-6">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#4F8CFF]/30 bg-[#4F8CFF]/10 text-[#4F8CFF]">
                <Radar size={42} className="animate-pulse" />
                <span className="absolute inset-0 animate-ping rounded-full border border-[#4F8CFF]/30" />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-white">Finding a match...</h2>
              <p className="mt-2 max-w-md text-sm text-[#CBD5E1]">A live stranger conversation will open as soon as another user is available.</p>
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
              <div className="flex-1 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-[#CBD5E1]">No messages yet. Say hello.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="rounded-xl bg-white/[0.05] p-3 text-sm text-white">
                      {msg.text}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message..." />
                <Button type="button" onClick={sendMessage}><Send size={16} /> Send</Button>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">How it works</h2>
          <div className="mt-4 space-y-4 text-sm text-[#CBD5E1]">
            <p>1. You join the queue from your authenticated account.</p>
            <p>2. The service searches for another waiting user and creates a temporary stranger conversation.</p>
            <p>3. Once matched, this panel becomes the live chat surface.</p>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}
