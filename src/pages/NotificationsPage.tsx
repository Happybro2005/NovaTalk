import { useEffect, useState } from 'react'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types/models'
import { Link } from 'react-router-dom'

export default function NotificationsPage() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!currentUser) return
    return notificationService.listen(currentUser.uid, setNotifications)
  }, [currentUser])

  return (
    <AppShell>
      <Eyebrow>NOTIFICATIONS</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Recent alerts</h1>
      <p className="mt-1 text-[#CBD5E1]">This view updates in real time with onSnapshot.</p>

      <div className="mt-8 space-y-4">
        {notifications.length === 0 ? (
          <GlassCard className="p-6 text-[#CBD5E1]">No notifications yet.</GlassCard>
        ) : notifications.map((notification) => (
          <GlassCard key={notification.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-[#4F8CFF]">
                <Bell size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{notification.message}</p>
                  <Badge tone={notification.read ? 'neutral' : 'primary'}>{notification.read ? 'Read' : 'New'}</Badge>
                </div>
                <p className="mt-1 text-sm text-[#CBD5E1]">Type: {notification.type}</p>
              </div>
              <div className="flex gap-2">
                {!notification.read && (
                  <Button size="sm" variant="secondary" onClick={async () => notificationService.markAsRead(notification.id)}>
                    <CheckCheck size={16} /> Mark read
                  </Button>
                )}
                {notification.link && (
                  <Link className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-white hover:bg-white/[0.08]" to={notification.link}>
                    <ExternalLink size={16} /> Open
                  </Link>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  )
}
