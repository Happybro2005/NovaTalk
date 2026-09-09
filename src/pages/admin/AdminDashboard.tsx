import { Layers3 } from 'lucide-react'
import AppShell from '../../components/AppShell'
import { Badge, GlassCard } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDashboard() {
  const { currentUser } = useAuth()

  return (
    <AppShell>
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 text-white"><Layers3 size={18} /> Admin</div>
        <p className="mt-4 text-[#CBD5E1]">Welcome, {currentUser?.displayName}</p>
        <Badge className="mt-4" tone="neutral">Dashboard ready</Badge>
      </GlassCard>
    </AppShell>
  )
}
