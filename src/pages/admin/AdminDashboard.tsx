import { motion } from 'framer-motion'
import {
  Users,
  Activity,
  Compass,
  MessageSquare,
  Flag,
  LifeBuoy,
  LayoutGrid,
  BarChart3,
  ScrollText,
  Settings,
  Database,
  LogOut,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AmbientBackdrop from '../../components/AmbientBackdrop'
import Logo from '../../components/Logo'
import { Badge, GlassCard, Eyebrow } from '../../components/ui'

const navItems = [
  { label: 'Overview', icon: LayoutGrid, to: '/admin/dashboard' },
  { label: 'Users', icon: Users, to: '/admin/users' },
  { label: 'Reports', icon: Flag, to: '/admin/reports' },
  { label: 'Communities', icon: Compass, to: '/admin/communities' },
  { label: 'Support', icon: LifeBuoy, to: '/admin/support' },
  { label: 'Analytics', icon: BarChart3, to: '/admin/analytics' },
  { label: 'Audit logs', icon: ScrollText, to: '/admin/audit-logs' },
  { label: 'Database health', icon: Database, to: '/admin/database' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
]

const widgets = [
  { label: 'Total users', value: '184,203', delta: '+2.4%', icon: Users, tone: 'primary' as const },
  { label: 'Online now', value: '12,847', delta: '+8.1%', icon: Activity, tone: 'success' as const },
  { label: 'Communities', value: '4,932', delta: '+1.2%', icon: Compass, tone: 'primary' as const },
  { label: 'Messages / day', value: '2.1M', delta: '+5.6%', icon: MessageSquare, tone: 'primary' as const },
  { label: 'Open reports', value: '38', delta: '-12%', icon: Flag, tone: 'warning' as const },
  { label: 'Support tickets', value: '112', delta: '-4%', icon: LifeBuoy, tone: 'danger' as const },
]

const recentUsers = [
  { name: 'Sana P.', role: 'Member', joined: 'Jul 26, 2026', status: 'active' },
  { name: 'Leo B.', role: 'Member', joined: 'Jul 26, 2026', status: 'active' },
  { name: 'Iris W.', role: 'Moderator', joined: 'Jul 25, 2026', status: 'active' },
  { name: 'Tom H.', role: 'Member', joined: 'Jul 25, 2026', status: 'suspended' },
]

const recentReports = [
  { user: 'Anonymous report #4471', severity: 'high', reason: 'Harassment in stranger chat' },
  { user: 'Anonymous report #4470', severity: 'medium', reason: 'Spam links in community post' },
  { user: 'Anonymous report #4468', severity: 'low', reason: 'Inappropriate display name' },
]

export default function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen">
      <AmbientBackdrop variant="aurora" />
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#050816]/60 backdrop-blur-xl lg:flex">
          <div className="px-6 py-6">
            <Logo />
            <Eyebrow>MISSION CONTROL</Eyebrow>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    active ? 'glass text-white glow-accent' : 'text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/[0.06] p-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#CBD5E1] hover:bg-white/[0.05] hover:text-white"
            >
              <LogOut size={17} /> Lock console
            </button>
          </div>
        </aside>

        <div className="min-h-screen flex-1 px-4 pb-16 pt-6 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Eyebrow>OVERVIEW</Eyebrow>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Mission Control
            </h1>
            <p className="mt-1.5 text-[#CBD5E1]">Platform-wide health, growth, and moderation at a glance.</p>
          </motion.div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {widgets.map((w) => (
              <GlassCard key={w.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F8CFF]/15 text-[#4F8CFF]`}>
                    <w.icon size={19} />
                  </div>
                  <Badge tone={w.delta.startsWith('-') ? 'success' : 'success'}>{w.delta}</Badge>
                </div>
                <div className="mt-4 text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {w.value}
                </div>
                <div className="mt-1 text-sm text-[#CBD5E1]/70">{w.label}</div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Growth chart placeholder */}
            <GlassCard className="p-5 lg:col-span-2">
              <h2 className="mb-4 font-semibold text-white">User growth — last 30 days</h2>
              <svg viewBox="0 0 400 140" className="w-full">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F8CFF" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,110 C30,100 60,60 90,70 C120,80 150,40 180,45 C210,50 240,30 270,35 C300,40 330,20 360,25 L400,10 L400,140 L0,140 Z"
                  fill="url(#areaGrad)"
                />
                <path
                  d="M0,110 C30,100 60,60 90,70 C120,80 150,40 180,45 C210,50 240,30 270,35 C300,40 330,20 360,25 L400,10"
                  fill="none"
                  stroke="#4F8CFF"
                  strokeWidth="2.5"
                />
              </svg>
            </GlassCard>

            {/* Recent reports */}
            <GlassCard className="p-5">
              <h2 className="mb-4 font-semibold text-white">Recent reports</h2>
              <div className="space-y-3">
                {recentReports.map((r) => (
                  <div key={r.user} className="border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#CBD5E1]/60">{r.user}</span>
                      <Badge tone={r.severity === 'high' ? 'danger' : r.severity === 'medium' ? 'warning' : 'neutral'}>
                        {r.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[#CBD5E1]">{r.reason}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Recent users table */}
          <GlassCard className="mt-6 overflow-x-auto p-5">
            <h2 className="mb-4 font-semibold text-white">Recent users</h2>
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[#CBD5E1]/50">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.name} className="border-t border-white/[0.06]">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-xs font-semibold">
                          {u.name[0]}
                        </div>
                        <span className="text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-[#CBD5E1]">{u.role}</td>
                    <td className="py-3 text-[#CBD5E1]">{u.joined}</td>
                    <td className="py-3">
                      <Badge tone={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
