import { useEffect, useState } from 'react'
import { PlusCircle, Users } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { communityService } from '../services/communityService'
import type { Community } from '../types/models'

export default function CommunitiesPage() {
  const { currentUser } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])

  async function loadCommunities() {
    setCommunities(await communityService.getCommunities())
  }

  useEffect(() => {
    loadCommunities()
  }, [])

  return (
    <AppShell>
      <Eyebrow>COMMUNITIES</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Discover communities</h1>
      <p className="mt-1 text-[#CBD5E1]">Live discoverable communities backed by Firestore.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {communities.map((community) => (
          <GlassCard key={community.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] text-white">
                <Users size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-white">{community.name}</h2>
                <p className="mt-1 text-sm text-[#CBD5E1]">{community.description}</p>
                <Badge className="mt-3" tone="neutral">{community.memberCount} members</Badge>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={async () => { if (currentUser) { await communityService.joinCommunity(currentUser.uid, community.id); await loadCommunities() } }}>
              <PlusCircle size={16} /> Join community
            </Button>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  )
}
