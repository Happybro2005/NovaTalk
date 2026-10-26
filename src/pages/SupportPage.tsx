import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, LifeBuoy, MessageSquare, Send, ShieldCheck, User } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Input, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { supportService } from '../services/supportService'
import { userService } from '../services/userService'
import type { SupportTicket } from '../types/models'

export default function SupportPage() {
  const { currentUser } = useAuth()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!currentUser) return
    void userService.getUserProfile(currentUser.uid).then((profile) => {
      setUserName(profile?.novaName || profile?.displayName || currentUser.email || 'Member')
    })
    return supportService.listenToUserTickets(currentUser.uid, (data) => {
      setTickets(data)
    })
  }, [currentUser])

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUser) return
    if (!subject.trim() || !message.trim()) {
      setError('Please provide both a subject and details for your ticket.')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')
      await supportService.createTicket(
        currentUser.uid,
        subject,
        message,
        userName,
        currentUser.email || ''
      )
      setSubject('')
      setMessage('')
      setSuccess('Your support ticket has been submitted. Our team will review it shortly.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSendReply(ticketId: string) {
    const replyText = replyDrafts[ticketId]?.trim()
    if (!currentUser || !replyText) return

    try {
      setReplyingTicketId(ticketId)
      await supportService.replyToTicket(ticketId, currentUser.uid, userName, replyText)
      setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reply.')
    } finally {
      setReplyingTicketId(null)
    }
  }

  function getStatusBadge(status?: string) {
    switch (status) {
      case 'resolved':
        return <Badge tone="success">Resolved</Badge>
      case 'in_progress':
        return <Badge tone="primary">In Progress</Badge>
      case 'closed':
        return <Badge tone="neutral">Closed</Badge>
      default:
        return <Badge tone="warning">Pending Review</Badge>
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-1">
        <Eyebrow>SUPPORT & ASSISTANCE</Eyebrow>
        <h1 className="mt-1 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Help Center
        </h1>
        <p className="text-sm text-[#CBD5E1]">
          Raise an issue, track ticket status in real time, and converse with support administrators.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Left Column: Submit Ticket Form */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2.5 text-white font-medium">
              <LifeBuoy size={20} className="text-[#4F8CFF]" />
              <span>Raise a new ticket</span>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="mt-5 space-y-4">
              <Input
                label="Subject"
                placeholder="e.g. Account issue, group bug, report question..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />

              <label className="block text-sm font-medium text-[#CBD5E1]">
                Message Details
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or inquiry thoroughly..."
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-[#CBD5E1]/40 outline-none focus:border-[#4F8CFF]/60 focus:ring-2 focus:ring-[#4F8CFF]/20"
                  required
                />
              </label>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting ticket...' : 'Submit ticket'}
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: User's Existing Tickets & Live Conversation Threads */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={19} className="text-[#4F8CFF]" />
              <h2 className="font-semibold text-white">Your Submitted Tickets</h2>
            </div>
            <span className="text-xs text-[#CBD5E1]">{tickets.length} total</span>
          </div>

          <div className="space-y-4">
            {tickets.length === 0 ? (
              <GlassCard className="p-8 text-center text-[#CBD5E1]">
                <Clock size={32} className="mx-auto mb-2 text-[#CBD5E1]/40" />
                <p className="text-sm font-medium">You have not submitted any tickets yet.</p>
                <p className="mt-1 text-xs text-[#94A3B8]">Any issues you submit will appear here with live updates.</p>
              </GlassCard>
            ) : (
              tickets.map((ticket) => {
                const replies = ticket.replies || []
                const isReplying = replyingTicketId === ticket.id

                return (
                  <GlassCard key={ticket.id} className="p-5 flex flex-col gap-4">
                    {/* Ticket Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/[0.06] pb-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">{ticket.subject}</h3>
                        <p className="mt-0.5 text-xs text-[#94A3B8]">
                          Ticket ID: <span className="font-mono text-[#CBD5E1]">{ticket.id.slice(0, 10)}</span> •{' '}
                          {ticket.createdAt?.toMillis
                            ? new Date(ticket.createdAt.toMillis()).toLocaleString()
                            : 'Just now'}
                        </p>
                      </div>
                      <div>{getStatusBadge(ticket.status)}</div>
                    </div>

                    {/* Original Ticket Description */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm text-[#CBD5E1] whitespace-pre-wrap">
                      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Original inquiry:</p>
                      {ticket.message}
                    </div>

                    {/* Admin Comments & Discussion Thread */}
                    {replies.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <p className="text-xs font-semibold text-[#BFDBFE] uppercase tracking-wider">
                          Conversation & Admin Responses ({replies.length}):
                        </p>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {replies.map((reply) => {
                            const isAdmin = reply.senderRole === 'admin'
                            return (
                              <div
                                key={reply.id}
                                className={`rounded-xl p-3 text-sm ${
                                  isAdmin
                                    ? 'border border-[#4F8CFF]/30 bg-[#4F8CFF]/10 text-white shadow-sm'
                                    : 'border border-white/10 bg-white/[0.04] text-[#E2E8F0]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    {isAdmin ? (
                                      <ShieldCheck size={14} className="text-[#4F8CFF]" />
                                    ) : (
                                      <User size={14} className="text-[#94A3B8]" />
                                    )}
                                    <span className="text-xs font-semibold text-white">
                                      {reply.senderName || (isAdmin ? 'Support Admin' : 'You')}
                                    </span>
                                    {isAdmin && (
                                      <span className="rounded bg-[#4F8CFF]/20 px-1.5 py-0.2 text-[10px] font-medium text-[#93C5FD]">
                                        Support Staff
                                      </span>
                                    )}
                                  </div>

                                  {reply.createdAt && (
                                    <span className="text-[10px] text-[#94A3B8]">
                                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                                <p className="whitespace-pre-wrap text-xs sm:text-sm">{reply.message}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reply Section (Controlled by Admin via ticket.canUserReply) */}
                    {ticket.status !== 'closed' && (
                      <div className="border-t border-white/[0.06] pt-3">
                        {ticket.canUserReply ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Support has enabled replies for this ticket. You can respond below:</span>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type your response to support..."
                                value={replyDrafts[ticket.id] || ''}
                                onChange={(e) =>
                                  setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') void handleSendReply(ticket.id)
                                }}
                                className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-[#CBD5E1]/40 outline-none focus:border-[#4F8CFF]/60"
                              />
                              <Button
                                size="sm"
                                disabled={isReplying || !replyDrafts[ticket.id]?.trim()}
                                onClick={() => void handleSendReply(ticket.id)}
                              >
                                <Send size={14} />
                                {isReplying ? 'Sending...' : 'Reply'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#94A3B8] italic">
                            {ticket.status === 'resolved'
                              ? 'This ticket is resolved. If you have a new question, please open a new ticket.'
                              : 'Replies are currently managed by the support team. If an administrator asks for additional information, reply capability will open here.'}
                          </p>
                        )}
                      </div>
                    )}
                  </GlassCard>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
