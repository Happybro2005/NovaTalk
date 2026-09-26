import { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Button, GlassCard, Input, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { supportService } from '../services/supportService'

export default function SupportPage() {
  const { currentUser } = useAuth()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')

  return (
    <AppShell>
      <Eyebrow>SUPPORT</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Help center</h1>
      <p className="mt-1 text-[#CBD5E1]">Open a real support ticket in Firestore.</p>

      <GlassCard className="mt-8 max-w-2xl p-6">
        <div className="flex items-center gap-3 text-white"><LifeBuoy size={18} /> Submit a ticket</div>
        <div className="mt-5 space-y-4">
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <label className="block text-sm font-medium text-[#CBD5E1]">
            Message
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 min-h-40 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none" />
          </label>
          <Button onClick={async () => { if (!currentUser) return; await supportService.createTicket(currentUser.uid, subject, message); setSubject(''); setMessage(''); setSuccess('Ticket submitted successfully.') }}>
            Submit ticket
          </Button>
          {success && <p className="text-sm text-[#10B981]">{success}</p>}
        </div>
      </GlassCard>
    </AppShell>
  )
}
