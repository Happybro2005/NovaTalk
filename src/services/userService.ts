import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import type { User, UserSettings } from '../types/models'
import { db } from '../firebase'

export const userService = {
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
    }, { merge: true })
  },

  async createUserDocument(uid: string, data: Partial<User>) {
    const userRef = doc(db, 'users', uid)

    const userData: User = {
      uid,
      username: data.username || `user_${uid.substring(0, 6)}`,
      email: data.email || '',
      displayName: data.displayName || 'New User',
      avatarUrl: data.avatarUrl || '',
      bio: '',
      department: data.department || 'Undeclared',
      semester: data.semester || '1',
      country: data.country || 'Unknown',
      gender: data.gender || 'Prefer not to say',
      dob: null,
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
