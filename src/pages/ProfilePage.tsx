<<<<<<< HEAD
import { useNavigate } from 'react-router-dom'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('novatalk-user')
    if (!raw) return { name: 'Your Name', username: '@username', bio: 'Exploring ideas, people, and new conversations across the galaxy.' }
    const user = JSON.parse(raw)
    return user && typeof user === 'object'
      ? {
          name: user.name || 'Your Name',
          username: user.username || '@username',
          bio: user.bio || 'Exploring ideas, people, and new conversations across the galaxy.',
          email: user.email || 'you@example.com',
        }
      : {
          name: 'Your Name',
          username: '@username',
          bio: 'Exploring ideas, people, and new conversations across the galaxy.',
          email: 'you@example.com',
        }
  } catch {
    return {
      name: 'Your Name',
      username: '@username',
      bio: 'Exploring ideas, people, and new conversations across the galaxy.',
      email: 'you@example.com',
    }
  }
}

function getInitials(name = 'User') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const handleLogout = () => {
    localStorage.removeItem('novatalk-user')
    navigate('/login')
  }

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (document.referrer && document.referrer.includes(window.location.host)) {
                  window.history.back()
                } else {
                  navigate('/dashboard')
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#CBD5E1] hover:bg-white/[0.06]"
              aria-label="Go back"
            >
              ←
            </button>
            <div>
              <div className="eyebrow">PROFILE</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                My profile
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
          >
            <span>Log out</span>
          </button>
        </header>

        <main className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="glass-strong rounded-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-2xl font-semibold">
                {getInitials(user.name)}
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{user.name}</h2>
              <p className="mt-1 text-sm text-[#CBD5E1]">{user.username}</p>
            </div>

            <div className="mt-6 space-y-3 text-sm text-[#CBD5E1]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[#CBD5E1]/60">Bio</div>
                <p className="mt-2 text-white/90">{user.bio}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[#CBD5E1]/60">Email</div>
                <p className="mt-2 text-white">{user.email}</p>
              </div>
            </div>
          </aside>

          <section className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <div className="eyebrow">ACCOUNT</div>
              <h2 className="mt-1 text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Profile details
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-[#CBD5E1]">
                <span className="mb-2 block">Display name</span>
                <input
                  type="text"
                  value={user.name}
                  readOnly
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white outline-none"
                />
              </label>

              <label className="block text-sm text-[#CBD5E1]">
                <span className="mb-2 block">Username</span>
                <input
                  type="text"
                  value={user.username}
                  readOnly
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white outline-none"
                />
              </label>

              <label className="block text-sm text-[#CBD5E1] md:col-span-2">
                <span className="mb-2 block">Bio</span>
                <textarea
                  rows={4}
                  readOnly
                  value={user.bio}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-white outline-none"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3d7eff]"
              >
                Save changes
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
=======
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { User, Mail, Globe, Shield, Edit3, Camera, X } from 'lucide-react'
import AppShell from '../components/AppShell'
import { GlassCard, Button, Badge, Input } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { db, storage } from '../firebase'

export default function ProfilePage() {
  const { currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '')
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayName(currentUser?.displayName ?? '')
    setAvatarUrl(currentUser?.photoURL ?? '')
  }, [currentUser])

  async function saveProfile(nextDisplayName: string, nextAvatarUrl: string) {
    if (!currentUser) return

    const trimmedName = nextDisplayName.trim()
    if (!trimmedName) {
      throw new Error('Please enter a display name.')
    }

    await updateProfile(currentUser, {
      displayName: trimmedName,
      photoURL: nextAvatarUrl || null,
    })
    await setDoc(doc(db, 'users', currentUser.uid), {
      displayName: trimmedName,
      avatarUrl: nextAvatarUrl,
    }, { merge: true })

    setDisplayName(trimmedName)
    setAvatarUrl(nextAvatarUrl)
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setStatusMessage('')

    try {
      await saveProfile(displayName, avatarUrl)
      setIsEditing(false)
      setStatusMessage('Profile updated.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to update your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0]
    event.target.value = ''
    if (!photo || !currentUser) return

    if (!photo.type.startsWith('image/')) {
      setStatusMessage('Choose an image file for your profile picture.')
      return
    }
    if (photo.size > 5 * 1024 * 1024) {
      setStatusMessage('Profile pictures must be 5 MB or smaller.')
      return
    }

    setIsSaving(true)
    setStatusMessage('Uploading profile picture...')

    try {
      const imageRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}-${photo.name}`)
      await uploadBytes(imageRef, photo, { contentType: photo.type })
      const nextAvatarUrl = await getDownloadURL(imageRef)
      await saveProfile(displayName || currentUser.displayName || 'User', nextAvatarUrl)
      setStatusMessage('Profile picture updated.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to update your profile picture.')
    } finally {
      setIsSaving(false)
    }
  }

  const shownName = displayName || currentUser?.displayName || 'User'

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Profile</h1>
            <p className="mt-1 text-[#CBD5E1]">Manage your public identity and account visibility.</p>
          </div>
          <Button variant="secondary" onClick={() => { setStatusMessage(''); setIsEditing(true) }}><Edit3 size={16} /> Edit profile</Button>
        </div>
      </motion.div>

      {statusMessage && <p className="mt-4 text-sm text-[#CBD5E1]" role="status">{statusMessage}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <GlassCard className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#4F8CFF] to-[#7C3AED] text-3xl font-semibold text-white shadow-lg shadow-[#4F8CFF]/20">
                {avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : shownName[0]?.toUpperCase() || 'U'}
              </div>
              <button type="button" aria-label="Change profile picture" disabled={isSaving} onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0B1120] text-white hover:bg-[#10192D] disabled:cursor-not-allowed disabled:opacity-50">
                <Camera size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">{shownName}</h2>
            <p className="text-sm text-[#CBD5E1]">@{shownName.toLowerCase().replace(/\s+/g, '_')}</p>
            <Badge className="mt-3" tone="success">Verified</Badge>
            <p className="mt-4 text-sm text-[#CBD5E1]">
              {currentUser?.email || 'No email available'}
            </p>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center gap-2 text-white"><User size={18} /> About</div>
            <p className="text-sm leading-6 text-[#CBD5E1]">
              This is your public profile area. It stays aligned with the app's original glassmorphism layout and keeps the focus on identity and presence.
            </p>
          </GlassCard>

          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center gap-2 text-white"><Mail size={18} /> Contact</div>
              <p className="text-sm text-[#CBD5E1]">{currentUser?.email || 'No email'}</p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center gap-2 text-white"><Globe size={18} /> Location</div>
              <p className="text-sm text-[#CBD5E1]">Visible to friends only</p>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <div className="mb-4 flex items-center gap-2 text-white"><Shield size={18} /> Privacy</div>
            <p className="text-sm text-[#CBD5E1]">Your profile visibility and activity preferences are controlled in Settings.</p>
          </GlassCard>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <GlassCard strong className="w-full max-w-md p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 id="edit-profile-title" className="text-xl font-semibold text-white">Edit profile</h2>
              <button type="button" aria-label="Close edit profile" onClick={() => setIsEditing(false)} className="text-[#CBD5E1] hover:text-white"><X size={20} /></button>
            </div>
            <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
              <Input label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={50} autoFocus />
              <p className="text-sm text-[#CBD5E1]">Use the camera button on your profile picture to change it.</p>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </AppShell>
  )
}
>>>>>>> origin/Shubh
