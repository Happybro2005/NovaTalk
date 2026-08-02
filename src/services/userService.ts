import { doc, setDoc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore'
import type { User, UserSettings } from '../types/models'
import { db } from '../firebase'

export const userService = {
  async createUserDocument(uid: string, data: Partial<User>) {
    const userRef = doc(db, 'users', uid)

    const userData: User = {
      uid,
      username: data.username || `user_${uid.substring(0, 6)}`,
      email: data.email || '',
      displayName: data.displayName || 'New User',
      avatarUrl: data.avatarUrl || '',
      bio: '',
      country: data.country || 'Unknown',
      gender: data.gender || 'Prefer not to say',
      dob: null,
      language: data.language || 'English',
      createdAt: serverTimestamp() as Timestamp,
      lastSeen: serverTimestamp() as Timestamp,
      online: true,
      searchingForStranger: false,
      accountStatus: 'active',
      role: 'user',
      verificationStatus: false,
    }
    await setDoc(userRef, userData)

    const settingsRef = doc(db, `users/${uid}/settings`, 'default')
    const defaultSettings: UserSettings = {
      notifications: { push: true, email: false, mentions: true },
      privacy: { readReceipts: true, lastSeen: 'everyone', strangerChat: true },
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
    await updateDoc(doc(db, 'users', uid), {
      online,
      lastSeen: serverTimestamp(),
    })
  },

  async setSearchingForStranger(uid: string, searchingForStranger: boolean) {
    await updateDoc(doc(db, 'users', uid), {
      searchingForStranger,
      lastSeen: serverTimestamp(),
    })
  },

  async setOffline(uid: string) {
    await updateDoc(doc(db, 'users', uid), {
      online: false,
      searchingForStranger: false,
      lastSeen: serverTimestamp(),
    })
  },
}
