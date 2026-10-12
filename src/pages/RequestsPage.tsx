import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, MessageCircle, X, Users } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { friendService } from '../services/friendService'
import { chatService } from '../services/chatService'
import { studyGroupService } from '../services/studyGroupService'
import type { Conversation, FriendRequest, GroupRequest, User } from '../types/models'

export default function RequestsPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [received, setReceived] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [groupRequests, setGroupRequests] = useState<GroupRequest[]>([])
  const [requestUsers, setRequestUsers] = useState<Record<string, User | null>>({})
  const [requestLoading, setRequestLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [cancelingRequestId, setCancelingRequestId] = useState<string | null>(null)
  const [messageRequests, setMessageRequests] = useState<Conversation[]>([])
  const [messageRequestsLoading, setMessageRequestsLoading] = useState(true)
  const [handlingMessageRequestId, setHandlingMessageRequestId] = useState<string | null>(null)

  async function refresh() {
    if (!currentUser) return
    setGroupRequests(await studyGroupService.getRequests(currentUser.uid))
  }

  async function cancelFriendRequest(requestId: string) {
    if (!currentUser) return
    setCancelingRequestId(requestId)
    setRequestError('')
    try {
      await friendService.cancelRequest(requestId, currentUser.uid)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to cancel friend request.')
    } finally {
      setCancelingRequestId(null)
    }
  }

  async function respondToMessageRequest(request: Conversation, accepted: boolean) {
    if (!currentUser) return
    setHandlingMessageRequestId(request.id)
    setRequestError('')
    try {
      if (accepted) {
        await chatService.acceptMessageRequest(request.id, currentUser.uid)
        navigate(`/messages/${request.id}`)
      } else {
        await chatService.declineMessageRequest(request.id, currentUser.uid)
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to respond to this message request.')
    } finally {
      setHandlingMessageRequestId(null)
    }
  }

  useEffect(() => {
    if (!currentUser) return
    let active = true
    const unsubscribe = friendService.listenToRequests(currentUser.uid, (data) => {
      setReceived(data.received)
      setSent(data.sent)
      setRequestLoading(false)
      setRequestError('')
      const userIds = [...new Set([...data.received.map((request) => request.senderId), ...data.sent.map((request) => request.receiverId)])]
      void Promise.all(userIds.map(async (userId) => [userId, await friendService.getUser(userId)] as const))
        .then((users) => { if (active) setRequestUsers(Object.fromEntries(users)) })
        .catch((error: unknown) => { if (active) setRequestError(error instanceof Error ? error.message : 'Unable to load request profiles.') })
    }, (error) => {
      if (!active) return
      setRequestLoading(false)
      setRequestError(error.message || 'Unable to load friend requests.')
    })
    const unsubscribeMessageRequests = chatService.listenToMessageRequests(currentUser.uid, (requests) => {
      setMessageRequests(requests)
      setMessageRequestsLoading(false)
      const senderIds = [...new Set(requests.map((request) => request.messageRequestFrom ?? request.createdBy ?? '').filter(Boolean))]
      void Promise.all(senderIds.map(async (userId) => [userId, await friendService.getUser(userId)] as const))
        .then((users) => { if (active) setRequestUsers((current) => ({ ...current, ...Object.fromEntries(users) })) })
        .catch((error: unknown) => { if (active) setRequestError(error instanceof Error ? error.message : 'Unable to load message request profiles.') })
    }, (error) => {
      if (!active) return
      setMessageRequestsLoading(false)
      setRequestError(error.message || 'Unable to load message requests.')
    })
    void studyGroupService.getRequests(currentUser.uid).then(setGroupRequests).catch((error: unknown) => {
      if (active) setRequestError(error instanceof Error ? error.message : 'Unable to load group invitations.')
    })
    return () => {
      active = false
      unsubscribe()
      unsubscribeMessageRequests()
    }
  }, [currentUser])

  return (
    <AppShell>
      <Eyebrow>REQUESTS</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Friend requests</h1>
      <p className="mt-1 text-[#CBD5E1]">Incoming and outgoing requests live in Firestore.</p>
      {requestError && <p role="alert" className="mt-4 text-sm text-red-300">{requestError}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">Msg request</h2>
          <div className="mt-4 space-y-3">
            {messageRequestsLoading ? <p className="text-sm text-[#CBD5E1]">Loading message requests...</p> : messageRequests.length === 0 ? (
              <p className="text-sm text-[#CBD5E1]">No message requests.</p>
            ) : messageRequests.map((request) => {
              const senderId = request.messageRequestFrom ?? request.createdBy ?? ''
              return <div key={request.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3"><MessageCircle size={18} className="shrink-0 text-[#4F8CFF]" /><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{requestUsers[senderId]?.novaName ?? 'Loading...'}</p><p className="truncate text-xs text-[#CBD5E1]">@{requestUsers[senderId]?.username ?? ''}</p></div></div>
                <p className="mt-3 break-words text-sm text-[#CBD5E1]">{request.lastMessage?.previewText}</p>
                <div className="mt-4 flex gap-3"><Button disabled={handlingMessageRequestId === request.id} onClick={() => void respondToMessageRequest(request, true)}><Check size={16} /> Accept</Button><Button variant="ghost" disabled={handlingMessageRequestId === request.id} onClick={() => void respondToMessageRequest(request, false)}><X size={16} /> Decline</Button></div>
              </div>
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">Incoming</h2>
          <div className="mt-4 space-y-3">
            {requestLoading ? <p className="text-sm text-[#CBD5E1]">Loading requests...</p> : received.length === 0 ? (
              <p className="text-sm text-[#CBD5E1]">No pending requests.</p>
            ) : received.map((request) => (
              <div key={request.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Request from {requestUsers[request.senderId]?.novaName ?? 'Loading...'}</p>
                    <p className="text-xs text-[#CBD5E1]">@{requestUsers[request.senderId]?.username ?? ''}</p>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button onClick={async () => { await friendService.acceptRequest(request.id) }}><Check size={16} /> Accept</Button>
                  <Button variant="ghost" onClick={async () => { await friendService.declineRequest(request.id) }}><X size={16} /> Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">Group invitations</h2>
          <div className="mt-4 space-y-3">
            {groupRequests.length === 0 ? <p className="text-sm text-[#CBD5E1]">No group invitations.</p> : groupRequests.map((request) => (
              <div key={request.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3"><Users size={17} className="text-[#4F8CFF]" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">Invitation to {request.groupName}</p><p className="text-xs text-[#CBD5E1]">Status: {request.status}</p></div><Badge tone={request.status === 'accepted' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>{request.status}</Badge></div>
                {request.status === 'pending' && <div className="mt-4 flex gap-3"><Button onClick={async () => { await studyGroupService.respondToRequest(request.id, currentUser!.uid, true); await refresh() }}><Check size={16} /> Accept</Button><Button variant="ghost" onClick={async () => { await studyGroupService.respondToRequest(request.id, currentUser!.uid, false); await refresh() }}><X size={16} /> Reject</Button></div>}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">Outgoing</h2>
          <div className="mt-4 space-y-3">
            {requestLoading ? <p className="text-sm text-[#CBD5E1]">Loading requests...</p> : sent.length === 0 ? (
              <p className="text-sm text-[#CBD5E1]">You have not sent any requests yet.</p>
            ) : sent.map((request) => (
              <div key={request.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">To {requestUsers[request.receiverId]?.novaName ?? 'Loading...'}</p>
                    <p className="text-xs text-[#CBD5E1]">@{requestUsers[request.receiverId]?.username ?? ''}</p>
                  </div>
                  {request.status === 'pending' ? (
                    <Button size="sm" variant="secondary" disabled={cancelingRequestId === request.id} onClick={() => void cancelFriendRequest(request.id)}>
                      {cancelingRequestId === request.id ? 'Removing...' : 'Requested'}
                    </Button>
                  ) : (
                    <Badge tone={request.status === 'accepted' ? 'success' : 'danger'}>{request.status}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}
