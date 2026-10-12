import { doc, setDoc, getDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore'
import type { User, UserSettings } from '../types/models'
import { db } from '../firebase'

export const userService = {
  async updateNovaName(uid: string, nextNovaName: string) {
    const normalizedName = nextNovaName.trim()
    if (!normalizedName) {
      throw new Error('Please enter a NovaName before saving.')
    }
    if (!/^[a-zA-Z0-9 _.-]{2,32}$/.test(normalizedName)) {
      throw new Error('NovaName must be 2-32 characters using letters, numbers, spaces, dots, hyphens, or underscores.')
    }
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid)
      const snapshot = await transaction.get(userRef)
      if (!snapshot.exists()) throw new Error('Your profile could not be found.')
      const profile = snapshot.data() as Partial<User>
      if (profile.novaName === normalizedName) return

      const hasCustomNovaName = Boolean(profile.novaName && profile.novaName !== profile.username)
      const changedAt = profile.novaNameChangedAt?.toMillis?.() ?? 0
      const cooldownMs = 60 * 24 * 60 * 60 * 1000
      if (hasCustomNovaName && changedAt && Date.now() - changedAt < cooldownMs) {
        const days = Math.ceil((cooldownMs - (Date.now() - changedAt)) / (24 * 60 * 60 * 1000))
        throw new Error(`NovaName can be changed once every 2 months. Try again in about ${days} day${days === 1 ? '' : 's'}.`)
      }

      transaction.update(userRef, { novaName: normalizedName, novaNameChangedAt: serverTimestamp() })
    })
  },

  async ensureUserDocument(uid: string, data: Partial<User>) {
    const existing = await this.getUserProfile(uid)
    if (!existing) {
      await this.createUserDocument(uid, data)
      return
    }

    await setDoc(doc(db, 'users', uid), {
      email: data.email ?? existing.email,
      displayName: data.displayName ?? existing.displayName,
      avatarUrl: data.avatarUrl ?? existing.avatarUrl,
      ...(existing.novaName || data.novaName ? { novaName: existing.novaName || data.novaName } : {}),
      ...(existing.novaNameChangedAt ? { novaNameChangedAt: existing.novaNameChangedAt } : {}),
    }, { merge: true })
  },

  async createUserDocument(uid: string, data: Partial<User>) {
    const userRef = doc(db, 'users', uid)

    const defaultUsername = data.username || `user_${uid.substring(0, 6)}`
    const initialNovaName = data.novaName && data.novaName !== defaultUsername ? data.novaName : defaultUsername

    const userData: User = {
      uid,
      username: defaultUsername,
      novaName: initialNovaName,
      novaNameChangedAt: serverTimestamp() as Timestamp,
      email: data.email || '',
      displayName: data.displayName || 'New User',
      avatarUrl: data.avatarUrl || '',
      bio: '',
      department: data.department || 'Undeclared',
      semester: data.semester || '1',
      country: data.country || 'Unknown',
      gender: data.gender || 'Prefer not to say',
      dob: data.dob ?? null,
      language: data.language || 'English',
      subjects: data.subjects || [],
      interests: data.interests || [],
      skills: data.skills || [],
      createdAt: serverTimestamp() as Timestamp,
      lastSeen: serverTimestamp() as Timestamp,
      online: true,
      searchingForStudyPartner: false,
      accountStatus: 'active',
      role: 'user',
      verificationStatus: false,
    }
    await setDoc(userRef, userData)

    const settingsRef = doc(db, `users/${uid}/settings`, 'default')
    const defaultSettings: UserSettings = {
      notifications: { push: true, email: false, mentions: true },
      privacy: { readReceipts: true, lastSeen: 'everyone', studyMatch: true },
      theme: 'dark',
    }
    await setDoc(settingsRef, defaultSettings)
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const userRef = doc(db, 'users', uid)
    const snap = await getDoc(userRef)
    return snap.exists() ? (snap.data() as User) : null
  },

  async setPresence(uid: string, online: boolean) {
    await setDoc(doc(db, 'users', uid), {
      online,
      lastSeen: serverTimestamp(),
    }, { merge: true })
  },

  async setSearchingForStudyPartner(uid: string, searchingForStudyPartner: boolean) {
    await setDoc(doc(db, 'users', uid), {
      searchingForStudyPartner,
      lastSeen: serverTimestamp(),
    }, { merge: true })
  },

  async setOffline(uid: string) {
    await setDoc(doc(db, 'users', uid), {
      online: false,
      searchingForStudyPartner: false,
      lastSeen: serverTimestamp(),
    }, { merge: true })
  },
}
