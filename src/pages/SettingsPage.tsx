import { useEffect, useState } from 'react'
import { MoonStar, Shield, BellRing } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { UserSettings } from '../types/models'

const defaultSettings: UserSettings = {
  notifications: { push: true, email: false, mentions: true },
  privacy: { readReceipts: true, lastSeen: 'everyone', studyMatch: true },
  theme: 'dark',
}

export default function SettingsPage() {
  const { currentUser } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!currentUser) return
      const snap = await getDoc(doc(db, 'users', currentUser.uid, 'settings', 'default'))
      setSettings((snap.exists() ? (snap.data() as UserSettings) : defaultSettings))
    }
    load()
  }, [currentUser])

  async function save(next: UserSettings) {
    if (!currentUser) return
    setSaving(true)
    setSettings(next)
    await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'default'), next)
    setSaving(false)
  }

  return (
    <AppShell>
      <Eyebrow>SETTINGS</Eyebrow>
      <h1 className="mt-2 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Preferences</h1>
      <p className="mt-1 text-[#CBD5E1]">These values write directly to Firestore.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-white"><BellRing size={18} /> Notifications</div>
          <div className="mt-4 space-y-3 text-sm text-[#CBD5E1]">
            <button className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3" onClick={() => save({ ...settings, notifications: { ...settings.notifications, push: !settings.notifications.push } })}>
              Push notifications <Badge tone={settings.notifications.push ? 'success' : 'neutral'}>{settings.notifications.push ? 'On' : 'Off'}</Badge>
            </button>
            <button className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3" onClick={() => save({ ...settings, notifications: { ...settings.notifications, email: !settings.notifications.email } })}>
              Email alerts <Badge tone={settings.notifications.email ? 'success' : 'neutral'}>{settings.notifications.email ? 'On' : 'Off'}</Badge>
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-white"><Shield size={18} /> Privacy</div>
          <div className="mt-4 space-y-3 text-sm text-[#CBD5E1]">
            <button className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3" onClick={() => save({ ...settings, privacy: { ...settings.privacy, studyMatch: !settings.privacy.studyMatch } })}>
              Study matchmaking <Badge tone={settings.privacy.studyMatch ? 'success' : 'danger'}>{settings.privacy.studyMatch ? 'Allowed' : 'Blocked'}</Badge>
            </button>
            <button className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3" onClick={() => save({ ...settings, privacy: { ...settings.privacy, readReceipts: !settings.privacy.readReceipts } })}>
              Read receipts <Badge tone={settings.privacy.readReceipts ? 'success' : 'neutral'}>{settings.privacy.readReceipts ? 'On' : 'Off'}</Badge>
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-white"><MoonStar size={18} /> Theme</div>
          <div className="mt-4 space-y-2">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <Button key={theme} variant={settings.theme === theme ? 'primary' : 'secondary'} className="w-full" onClick={() => save({ ...settings, theme })}>
                {theme}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#CBD5E1]">{saving ? 'Saving...' : 'Changes persist on refresh.'}</p>
        </GlassCard>
      </div>
    </AppShell>
  )
}
