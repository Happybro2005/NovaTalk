import { useEffect, useState } from 'react'
import { Check, Layers3, ShieldAlert, UserRound, UsersRound, X } from 'lucide-react'
import AppShell from '../../components/AppShell'
import { Badge, Button, GlassCard } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/adminService'
import type { Report, User } from '../../types/models'

type Stats = Awaited<ReturnType<typeof adminService.getStats>>

export default function AdminDashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [error, setError] = useState('')

  async function loadData() {
    try {
      const [nextStats, nextUsers, nextReports] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getPendingReports(),
      ])
      setStats(nextStats)
      setUsers(nextUsers)
      setReports(nextReports)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin data.')
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
    await adminService.resolveReport(reportId, status)
    setReports((items) => items.filter((item) => item.id !== reportId))
  }

  async function suspendUser(uid: string) {
    await adminService.suspendUser(uid)
    setUsers((items) => items.map((user) => user.uid === uid ? { ...user, accountStatus: 'suspended' } : user))
  }

  const metrics: { label: string; value: number; icon: typeof UserRound }[] = [
    { label: 'Users', value: stats?.totalUsers ?? 0, icon: UserRound },
    { label: 'Online now', value: stats?.onlineUsers ?? 0, icon: UsersRound },
    { label: 'Pending reports', value: stats?.pendingReports ?? 0, icon: ShieldAlert },
    { label: 'Groups', value: stats?.communities ?? 0, icon: Layers3 },
  ]

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">MISSION CONTROL</p>
          <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Admin dashboard</h1>
          <p className="mt-1 text-[#CBD5E1]">Live data from your Firebase project, {currentUser?.displayName || 'operator'}.</p>
        </div>
        <Badge tone="success">Firebase connected</Badge>
      </div>

      {error && <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <GlassCard key={label} className="p-5">
            <div className="flex items-center justify-between text-[#CBD5E1]"><span className="text-sm">{label}</span><Icon size={18} /></div>
            <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="font-semibold text-white">Pending reports</h2>
          <div className="mt-4 space-y-3">
            {reports.length === 0 ? <p className="text-sm text-[#CBD5E1]">No pending reports.</p> : reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-medium text-white">{report.reason}</p><p className="mt-1 text-xs text-[#CBD5E1]">{report.targetType}: {report.targetId}</p></div>
                  <Badge tone="warning">Pending</Badge>
                </div>
                <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void resolveReport(report.id, 'resolved')}><Check size={15} /> Resolve</Button><Button size="sm" variant="ghost" onClick={() => void resolveReport(report.id, 'dismissed')}><X size={15} /> Dismiss</Button></div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-semibold text-white">User management</h2>
          <div className="mt-4 space-y-3">
            {users.length === 0 ? <p className="text-sm text-[#CBD5E1]">No users found.</p> : users.slice(0, 8).map((user) => (
              <div key={user.uid} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F8CFF]/20 text-sm text-white">{user.displayName?.[0]?.toUpperCase() || '?'}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{user.displayName}</p><p className="truncate text-xs text-[#CBD5E1]">{user.email}</p></div>
                <Badge tone={user.accountStatus === 'suspended' ? 'danger' : 'neutral'}>{user.accountStatus}</Badge>
                {user.accountStatus === 'active' && user.role === 'user' && <Button size="sm" variant="ghost" onClick={() => void suspendUser(user.uid)}>Suspend</Button>}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}
