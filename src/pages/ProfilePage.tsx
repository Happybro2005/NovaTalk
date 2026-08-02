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