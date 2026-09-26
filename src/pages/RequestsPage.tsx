import { useState } from 'react'
import { Check, X } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { friendService } from '../services/friendService'
import type { FriendRequest } from '../types/models'

export default function RequestsPage() {
  const { currentUser } = useAuth()
  const [received, setReceived] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])

  async function refresh() {
    if (!currentUser) return
    const data = await friendService.getRequests(currentUser.uid)
    setReceived(data.received)
    setSent(data.sent)
  }

  return (
    <AppShell>
      <Eyebrow>REQUESTS</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Friend requests</h1>
      <p className="mt-1 text-[#CBD5E1]">Incoming and outgoing requests live in Firestore.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">Incoming</h2>
          <div className="mt-4 space-y-3">
            {received.length === 0 ? (
              <p className="text-sm text-[#CBD5E1]">No pending requests.</p>
            ) : received.map((request) => (
              <div key={request.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Request from {request.senderId}</p>
                    <p className="text-xs text-[#CBD5E1]">Sent via live Firestore collection</p>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button onClick={async () => { await friendService.acceptRequest(request.id); await refresh() }}><Check size={16} /> Accept</Button>
                  <Button variant="ghost" onClick={async () => { await friendService.declineRequest(request.id); await refresh() }}><X size={16} /> Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-white">Outgoing</h2>
          <div className="mt-4 space-y-3">
            {sent.length === 0 ? (
              <p className="text-sm text-[#CBD5E1]">You have not sent any requests yet.</p>
            ) : sent.map((request) => (
              <div key={request.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">To {request.receiverId}</p>
                    <p className="text-xs text-[#CBD5E1]">Status: {request.status}</p>
                  </div>
                  <Badge tone={request.status === 'accepted' ? 'success' : request.status === 'declined' ? 'danger' : 'neutral'}>{request.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}
