import { useEffect, useState } from 'react'
import { MoonStar, Shield, BellRing } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import AppShell from '../components/AppShell'
import { Badge, Button, GlassCard, Eyebrow } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type { UserSettings } from '../types/models'
import { applyTheme, getStoredTheme } from '../utils/theme'

const defaultSettings: UserSettings = {
  notifications: { push: true, email: false, mentions: true },
  privacy: { readReceipts: true, lastSeen: 'everyone', studyMatch: true },
  theme: 'dark',
}

export default function SettingsPage() {
  const { currentUser } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    async function load() {
      if (!currentUser) return
      const snap = await getDoc(doc(db, 'users', currentUser.uid, 'settings', 'default'))
      const saved = snap.exists() ? snap.data() as Partial<UserSettings> : {}
      const activeTheme = saved.theme || getStoredTheme() || 'dark'
      const next: UserSettings = {
        ...defaultSettings,
        ...saved,
        theme: activeTheme,
        notifications: { ...defaultSettings.notifications, ...saved.notifications },
        privacy: { ...defaultSettings.privacy, ...saved.privacy },
      }
      setSettings(next)
      applyTheme(next.theme)
    }
    load()
  }, [currentUser])

  async function save(next: UserSettings) {
    if (!currentUser) return
    setSaving(true)
    setStatus('')
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'default'), next)
      setSettings(next)
      applyTheme(next.theme)
      setStatus('Saved to your account.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  async function togglePushNotifications() {
    if (!settings.notifications.push && 'Notification' in window && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('Browser notifications are blocked. Allow them in browser site settings first.')
        return
      }
    }
    await save({ ...settings, notifications: { ...settings.notifications, push: !settings.notifications.push } })
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
            <button disabled={saving} className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 disabled:opacity-50" onClick={togglePushNotifications}>
              Push notifications <Badge tone={settings.notifications.push ? 'success' : 'neutral'}>{settings.notifications.push ? 'On' : 'Off'}</Badge>
            </button>
            <button disabled={saving} className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 disabled:opacity-50" onClick={() => save({ ...settings, notifications: { ...settings.notifications, email: !settings.notifications.email } })}>
              Email alerts <Badge tone={settings.notifications.email ? 'success' : 'neutral'}>{settings.notifications.email ? 'On' : 'Off'}</Badge>
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-white"><Shield size={18} /> Privacy</div>
          <div className="mt-4 space-y-3 text-sm text-[#CBD5E1]">
            <label className="block rounded-xl bg-white/[0.04] px-4 py-3">
              <span className="mb-2 block">Who can see your online status?</span>
              <select value={settings.privacy.lastSeen} disabled={saving} onChange={(event) => void save({ ...settings, privacy: { ...settings.privacy, lastSeen: event.target.value as UserSettings['privacy']['lastSeen'] } })} className="theme-select w-full rounded-lg border border-white/10 bg-[#111522] px-3 py-2 text-sm text-white disabled:opacity-50">
                <option value="everyone">Everyone</option>
                <option value="friends">Friends</option>
                <option value="nobody">Nobody</option>
              </select>
            </label>
            <button disabled={saving} className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 disabled:opacity-50" onClick={() => save({ ...settings, privacy: { ...settings.privacy, studyMatch: !settings.privacy.studyMatch } })}>
              Friend discovery <Badge tone={settings.privacy.studyMatch ? 'success' : 'danger'}>{settings.privacy.studyMatch ? 'Allowed' : 'Blocked'}</Badge>
            </button>
            <button disabled={saving} className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 disabled:opacity-50" onClick={() => save({ ...settings, privacy: { ...settings.privacy, readReceipts: !settings.privacy.readReceipts } })}>
              Read receipts <Badge tone={settings.privacy.readReceipts ? 'success' : 'neutral'}>{settings.privacy.readReceipts ? 'On' : 'Off'}</Badge>
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-white"><MoonStar size={18} /> Theme</div>
          <div className="mt-4 space-y-2">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <Button key={theme} disabled={saving} variant={settings.theme === theme ? 'primary' : 'secondary'} className="w-full" onClick={() => save({ ...settings, theme })}>
                {theme}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#CBD5E1]">{saving ? 'Saving...' : status || 'Changes persist on refresh.'}</p>
        </GlassCard>
      </div>
    </AppShell>
  )
}
