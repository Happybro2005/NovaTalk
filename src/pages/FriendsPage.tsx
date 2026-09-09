import { useEffect, useState } from 'react'
import { MessageCircle, UserMinus } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { friendService } from '../services/friendService'
import type { User } from '../types/models'

export default function FriendsPage() {
  const { currentUser } = useAuth()
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!currentUser) return
      setLoading(true)
      setFriends(await friendService.getFriends(currentUser.uid))
      setLoading(false)
    }
    load()
  }, [currentUser])

  return (
    <AppShell>
      <Eyebrow>FRIENDS</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Your circle</h1>
      <p className="mt-1 text-[#CBD5E1]">Every friend shown here comes from Firestore friendships.</p>

      <div className="mt-8">
        {loading ? (
          <GlassCard className="p-6 text-[#CBD5E1]">Loading your friends...</GlassCard>
        ) : friends.length === 0 ? (
          <GlassCard className="p-6 text-[#CBD5E1]">No friends yet. Accept a request to build your list.</GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {friends.map((friend) => (
              <GlassCard key={friend.uid} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-sm font-semibold text-white">
                    {friend.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-white">{friend.displayName}</h2>
                    <p className="truncate text-sm text-[#CBD5E1]">@{friend.username}</p>
                    <Badge className="mt-2" tone="success">Online now</Badge>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button variant="secondary" className="flex-1"><MessageCircle size={16} /> Message</Button>
                  <Button variant="ghost" className="flex-1" onClick={async () => { if (currentUser) { await friendService.removeFriend(currentUser.uid, friend.uid); setFriends((items) => items.filter((item) => item.uid !== friend.uid)) } }}><UserMinus size={16} /> Remove</Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
