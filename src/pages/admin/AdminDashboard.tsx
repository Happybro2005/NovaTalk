import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  Layers3,
  LifeBuoy,
  Lock,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import AppShell from '../../components/AppShell'
import { Badge, Button, GlassCard } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'
import { adminService } from '../../services/adminService'
import { userService } from '../../services/userService'
import type { Report, SupportTicket, User } from '../../types/models'
import NotFoundPage from '../NotFoundPage'

type Stats = Awaited<ReturnType<typeof adminService.getStats>>

export default function AdminDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [error, setError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  // State for admin support ticket commenting and reply toggling
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({})
  const [allowUserReplyChecks, setAllowUserReplyChecks] = useState<Record<string, boolean>>({})
  const [sendingReplyTicketId, setSendingReplyTicketId] = useState<string | null>(null)
  const [togglingReplyTicketId, setTogglingReplyTicketId] = useState<string | null>(null)
  const [expandedTicketIds, setExpandedTicketIds] = useState<Record<string, boolean>>({})

  // Double-check admin authorization at the component level
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }

    let active = true
    userService.getUserProfile(currentUser.uid).then((profile) => {
      if (!active) return
      const role = profile?.role?.toString().trim().toLowerCase()
      if (role !== 'admin' && role !== 'moderator') {
        setAuthorized(false)
        navigate('/admin', { replace: true })
      } else {
        setAuthorized(true)
      }
    }).catch(() => {
      if (active) {
        setAuthorized(false)
        navigate('/admin', { replace: true })
      }
    })

    return () => { active = false }
  }, [currentUser, navigate])

  async function loadData() {
    try {
      const [statsResult, usersResult, reportsResult, ticketsResult] = await Promise.allSettled([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getPendingReports(),
        adminService.getSupportTickets(),
      ])

      if (statsResult.status === 'fulfilled') setStats(statsResult.value)
      if (usersResult.status === 'fulfilled') setUsers(usersResult.value)
      if (reportsResult.status === 'fulfilled') setReports(reportsResult.value)
      if (ticketsResult.status === 'fulfilled') setTickets(ticketsResult.value)

      const failures = [statsResult, usersResult, reportsResult, ticketsResult]
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason instanceof Error ? r.reason.message : 'Unknown load error')

      if (failures.length > 0) {
        setError(`Partial admin data warning: ${failures.join(' | ')}`)
      } else {
        setError('')
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin data.')
    }
  }

  useEffect(() => {
    if (authorized) {
      void loadData()
      // Real-time live synchronization for support tickets and user responses
      const unsubscribe = adminService.listenToSupportTickets((items) => {
        setTickets(items)
      })
      return () => unsubscribe()
    }
  }, [authorized])

  async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
    try {
      await adminService.resolveReport(reportId, status)
      setReports((items) => items.filter((item) => item.id !== reportId))
      setActionSuccess(`Report marked as ${status}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report.')
    }
  }

  async function handleTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ) {
    try {
      await adminService.resolveTicket(ticketId, status)
      setTickets((items) => items.map((t) => t.id === ticketId ? { ...t, status } : t))
      setActionSuccess(`Ticket updated to "${status}".`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket.')
    }
  }

  async function handleSendAdminComment(ticketId: string) {
    const text = adminReplies[ticketId]?.trim()
    if (!text || !currentUser) return

    const allowReply = allowUserReplyChecks[ticketId] ?? true
    try {
      setSendingReplyTicketId(ticketId)
      const adminName = currentUser.displayName || 'Support Admin'
      await adminService.addAdminComment(ticketId, currentUser.uid, adminName, text, allowReply)
      setAdminReplies((prev) => ({ ...prev, [ticketId]: '' }))
      setActionSuccess(`Comment added${allowReply ? ' and user reply enabled' : ''}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment.')
    } finally {
      setSendingReplyTicketId(null)
    }
  }

  async function handleToggleUserReply(ticketId: string, currentVal: boolean) {
    try {
      setTogglingReplyTicketId(ticketId)
      const nextVal = !currentVal
      await adminService.toggleUserReply(ticketId, nextVal)
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, canUserReply: nextVal } : t))
      setActionSuccess(`User replies are now ${nextVal ? 'ENABLED' : 'LOCKED'} for this ticket.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle user reply.')
    } finally {
      setTogglingReplyTicketId(null)
    }
  }

  async function handleDeleteTicket(ticketId: string) {
    if (!window.confirm('Delete this support ticket permanently?')) return
    try {
      await adminService.deleteTicket(ticketId)
      setTickets((items) => items.filter((t) => t.id !== ticketId))
      setActionSuccess('Ticket deleted successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ticket.')
    }
  }

  async function suspendUser(uid: string) {
    try {
      await adminService.suspendUser(uid)
      setUsers((items) => items.map((user) => user.uid === uid ? { ...user, accountStatus: 'suspended' } : user))
      setActionSuccess('User account suspended.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user.')
    }
  }

  async function handleDeleteUser(user: User) {
    if (currentUser && user.uid === currentUser.uid) {
      alert('You cannot delete your own admin account.')
      return
    }

    const userName = user.novaName || user.displayName || user.username || user.email || 'this user'
    if (!window.confirm(`Are you sure you want to permanently delete "${userName}" (${user.email || user.uid}) from the database?\n\nThis will totally remove them from search and friend discovery, and show them as "Deleted User" in past chat histories.`)) {
      return
    }

    try {
      setDeletingUserId(user.uid)
      await adminService.deleteUser(user.uid)
      setUsers((items) => items.filter((u) => u.uid !== user.uid))
      setStats((prev) => prev ? { ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) } : null)
      setActionSuccess(`User "${userName}" was totally deleted from the database.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.')
    } finally {
      setDeletingUserId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true
    const term = userSearch.toLowerCase()
    return (
      u.displayName?.toLowerCase().includes(term) ||
      u.novaName?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    )
  })

  const isUserOnline = (u: User) => {
    if (!u.online) return false
    const lastSeen = u.lastSeen?.toMillis?.() ?? 0
    return lastSeen > 0 && Date.now() - lastSeen < 75_000
  }

  const liveOnlineCount = users.filter(isUserOnline).length

  const metrics = [
    { label: 'Total Users', value: stats?.totalUsers ?? users.length, icon: UserRound },
    { label: 'Online now', value: liveOnlineCount, icon: UsersRound },
    { label: 'Support Tickets', value: tickets.filter((t) => t.status === 'open' || !t.status).length, icon: LifeBuoy, total: tickets.length },
    { label: 'Pending reports', value: reports.length, icon: ShieldAlert },
    { label: 'Groups', value: stats?.communities ?? 0, icon: Layers3 },
  ]

  if (authorized === false) {
    return <NotFoundPage />
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="eyebrow">MISSION CONTROL</p>
          <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Admin dashboard</h1>
          <p className="mt-1 text-[#CBD5E1]">Live governance and platform control, {currentUser?.displayName || 'operator'}.</p>
        </div>
        <Badge tone="success">Admin access verified</Badge>
      </div>

      {error && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-300 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {actionSuccess && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-300 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon, total }) => (
          <GlassCard key={label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-[#CBD5E1]">
              <span className="text-xs sm:text-sm">{label}</span>
              <Icon size={18} className="text-[#4F8CFF]" />
            </div>
            <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold text-white">
              {value}
              {total !== undefined && <span className="ml-1 text-xs font-normal text-[#94A3B8]">/ {total}</span>}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Grid: Support Tickets & User Management */}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">

        {/* Support Tickets Card */}
        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy size={20} className="text-[#4F8CFF]" />
              <h2 className="font-semibold text-white">Support Tickets</h2>
            </div>
            <span className="text-xs text-[#CBD5E1]">{tickets.length} total</span>
          </div>

          <div className="mt-4 flex-1 space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#CBD5E1]">No support tickets submitted yet.</p>
            ) : (
              tickets.map((ticket) => {
                const submitter = users.find((u) => u.uid === ticket.userId)
                const submitterLabel =
                  ticket.userName ||
                  submitter?.novaName ||
                  submitter?.displayName ||
                  ticket.userEmail ||
                  submitter?.email ||
                  `User: ${ticket.userId.slice(0, 8)}...`
                const replies = ticket.replies || []
                const isReplying = sendingReplyTicketId === ticket.id
                const isToggling = togglingReplyTicketId === ticket.id
                const canUserReply = !!ticket.canUserReply
                const replyText = adminReplies[ticket.id] || ''
                const allowReplyCheck = allowUserReplyChecks[ticket.id] ?? true

                const getStatusTone = (status?: string) => {
                  switch (status) {
                    case 'resolved':
                      return 'success' as const
                    case 'in_progress':
                      return 'primary' as const
                    case 'closed':
                      return 'neutral' as const
                    default:
                      return 'warning' as const
                  }
                }

                const isExpanded = !!expandedTicketIds[ticket.id]

                return (
                  <div
                    key={ticket.id}
                    className={`rounded-xl border border-white/10 bg-white/[0.04] transition-all duration-200 ${
                      isExpanded ? 'p-4 space-y-3.5 ring-1 ring-white/10' : 'p-3 hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    {/* Collapsible Trigger Header */}
                    <div
                      onClick={() => setExpandedTicketIds((prev) => ({ ...prev, [ticket.id]: !prev[ticket.id] }))}
                      className="flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{ticket.subject || 'No subject'}</p>
                          {replies.length > 0 && (
                            <span className="flex items-center gap-1 rounded bg-[#4F8CFF]/15 px-1.5 py-0.2 text-[10px] font-medium text-[#BFDBFE]">
                              <MessageSquare size={10} /> {replies.length}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-[#94A3B8] truncate">
                          From: <span className="font-medium text-[#BFDBFE]">{submitterLabel}</span>
                          {ticket.createdAt?.toMillis && (
                            <span className="ml-2 text-[11px] text-[#64748B]">
                              • {new Date(ticket.createdAt.toMillis()).toLocaleString()}
                            </span>
                          )}
                          {!isExpanded && ticket.message && (
                            <span className="ml-2 text-[#94A3B8]/60 italic truncate">
                              — {ticket.message.slice(0, 50)}{ticket.message.length > 50 ? '...' : ''}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge tone={getStatusTone(ticket.status)}>
                          {ticket.status === 'in_progress' ? 'In Progress' : ticket.status || 'Open'}
                        </Badge>
                        <ChevronDown
                          size={18}
                          className={`text-[#94A3B8] transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded Content Section */}
                    {isExpanded && (
                      <div className="space-y-3.5 pt-2 border-t border-white/[0.06] animate-in fade-in duration-150">
                        {/* Original Message */}
                        <div className="bg-black/25 rounded-xl p-3 border border-white/5">
                          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Inquiry Details:</p>
                          <p className="text-xs sm:text-sm text-[#CBD5E1] whitespace-pre-wrap">{ticket.message}</p>
                        </div>

                        {/* Conversation / Discussion Thread */}
                        {replies.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#BFDBFE]">
                              <MessageSquare size={13} className="text-[#4F8CFF]" />
                              <span>Conversation & Replies ({replies.length}):</span>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {replies.map((reply) => {
                                const isAdmin = reply.senderRole === 'admin'
                                return (
                                  <div
                                    key={reply.id}
                                    className={`rounded-xl p-2.5 text-xs sm:text-sm ${
                                      isAdmin
                                        ? 'border border-[#4F8CFF]/30 bg-[#4F8CFF]/10 text-white'
                                        : 'border border-white/10 bg-white/[0.04] text-[#E2E8F0]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <div className="flex items-center gap-1.5">
                                        {isAdmin ? (
                                          <ShieldCheck size={13} className="text-[#4F8CFF]" />
                                        ) : (
                                          <UserRound size={13} className="text-[#94A3B8]" />
                                        )}
                                        <span className="text-xs font-semibold text-white">
                                          {reply.senderName || (isAdmin ? 'Admin' : 'User')}
                                        </span>
                                        {isAdmin && (
                                          <span className="rounded bg-[#4F8CFF]/25 px-1 py-0.2 text-[10px] font-medium text-[#BFDBFE]">
                                            Admin
                                          </span>
                                        )}
                                      </div>
                                      {reply.createdAt && (
                                        <span className="text-[10px] text-[#94A3B8]">
                                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                    <p className="whitespace-pre-wrap">{reply.message}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* User Reply Capability Banner & Instant Toggle */}
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            {canUserReply ? (
                              <>
                                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="font-medium text-emerald-400 flex items-center gap-1">
                                  <Unlock size={13} /> User reply enabled
                                </span>
                              </>
                            ) : (
                              <span className="text-[#94A3B8] flex items-center gap-1">
                                <Lock size={13} /> User reply locked
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isToggling}
                            onClick={() => void handleToggleUserReply(ticket.id, canUserReply)}
                            className="text-xs py-1 h-auto"
                          >
                            {isToggling ? 'Updating...' : canUserReply ? 'Lock Reply' : 'Enable Reply'}
                          </Button>
                        </div>

                        {/* Admin Comment / Inquiry Form */}
                        <div className="space-y-2 border-t border-white/[0.06] pt-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setAdminReplies((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder={`Ask ${ticket.userName || 'the user'} something or write a resolution note...`}
                            rows={2}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-xs text-white placeholder:text-[#CBD5E1]/40 outline-none focus:border-[#4F8CFF]/60"
                          />

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs text-[#CBD5E1] cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={allowReplyCheck}
                                onChange={(e) => setAllowUserReplyChecks((prev) => ({ ...prev, [ticket.id]: e.target.checked }))}
                                className="rounded border-white/20 bg-white/10 text-[#4F8CFF] focus:ring-0"
                              />
                              <span>Allow user to reply to this</span>
                            </label>

                            <Button
                              size="sm"
                              disabled={isReplying || !replyText.trim()}
                              onClick={() => void handleSendAdminComment(ticket.id)}
                            >
                              <Send size={13} />
                              {isReplying ? 'Sending...' : 'Send Comment'}
                            </Button>
                          </div>
                        </div>

                        {/* Quick Ticket Status Controls */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                          {ticket.status !== 'resolved' && (
                            <Button size="sm" onClick={() => void handleTicketStatus(ticket.id, 'resolved')}>
                              <Check size={14} /> Mark Resolved
                            </Button>
                          )}
                          {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                            <Button size="sm" variant="ghost" onClick={() => void handleTicketStatus(ticket.id, 'in_progress')}>
                              In Progress
                            </Button>
                          )}
                          {ticket.status === 'resolved' && (
                            <Button size="sm" variant="ghost" onClick={() => void handleTicketStatus(ticket.id, 'open')}>
                              Re-open
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 ml-auto"
                            onClick={() => void handleDeleteTicket(ticket.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </GlassCard>

        {/* User Management Card with Delete Functionality */}
        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserRound size={20} className="text-[#4F8CFF]" />
              <h2 className="font-semibold text-white">User Management</h2>
            </div>
            <span className="text-xs text-[#CBD5E1]">{filteredUsers.length} shown</span>
          </div>

          {/* User Search Input */}
          <div className="relative mt-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CBD5E1]/50" />
            <input
              type="text"
              placeholder="Search by name, @username, or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-1.5 pl-9 pr-3 text-xs sm:text-sm text-white placeholder:text-[#CBD5E1]/40 outline-none focus:border-[#4F8CFF]/60"
            />
          </div>

          <div className="mt-4 flex-1 space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#CBD5E1]">No users found matching search.</p>
            ) : (
              filteredUsers.map((user) => {
                const isCurrentAdmin = currentUser?.uid === user.uid
                const isDeleting = deletingUserId === user.uid

                const isUserActive = isUserOnline(user)

                return (
                  <div key={user.uid} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF]/30 to-[#7C3AED]/30 text-sm font-semibold text-white border border-white/10">
                        {user.novaName?.[0]?.toUpperCase() || user.displayName?.[0]?.toUpperCase() || '?'}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0F19] ${
                            isUserActive ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">{user.novaName || user.displayName}</p>
                          {user.username && <span className="text-xs text-[#94A3B8]">@{user.username}</span>}
                          {user.role === 'admin' && <Badge tone="primary">Admin</Badge>}
                          {isUserActive ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#64748B]">Offline</span>
                          )}
                        </div>
                        <p className="truncate text-xs text-[#CBD5E1]/70">{user.email || user.uid}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Badge tone={user.accountStatus === 'suspended' ? 'danger' : 'neutral'}>
                        {user.accountStatus}
                      </Badge>

                      {user.accountStatus === 'active' && user.role !== 'admin' && (
                        <Button size="sm" variant="ghost" onClick={() => void suspendUser(user.uid)}>
                          Suspend
                        </Button>
                      )}

                      {!isCurrentAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isDeleting}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => void handleDeleteUser(user)}
                        >
                          <Trash2 size={14} />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </GlassCard>

      </div>

      {/* Pending Reports Section */}
      <div className="mt-8">
        <GlassCard className="p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-400" />
            <h2 className="font-semibold text-white">Pending Reports</h2>
            <span className="ml-auto text-xs text-[#CBD5E1]">{reports.length} pending</span>
          </div>

          <div className="mt-4 space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-[#CBD5E1]">No pending reports in the system.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{report.reason}</p>
                      <p className="mt-1 text-xs text-[#CBD5E1]">
                        Target: <span className="text-white">{report.targetType}</span> ({report.targetId})
                      </p>
                    </div>
                    <Badge tone="warning">Pending</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => void resolveReport(report.id, 'resolved')}>
                      <Check size={15} /> Resolve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void resolveReport(report.id, 'dismissed')}>
                      <X size={15} /> Dismiss
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  )
}
