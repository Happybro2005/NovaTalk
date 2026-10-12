import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { db } from '../firebase'
import { userService } from '../services/userService'
import type { User as StudentProfile, UserSettings } from '../types/models'
import { getStoredTheme, watchTheme } from '../utils/theme'
import { doc, onSnapshot } from 'firebase/firestore'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string, profile?: Partial<StudentProfile>) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let detachLifecycleHandlers: (() => void) | null = null
    let detachSettingsListener: (() => void) | null = null
    let detachThemeListener: (() => void) | null = null

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      detachSettingsListener?.()
      detachSettingsListener = null
      detachThemeListener?.()
      detachThemeListener = null
      if (detachLifecycleHandlers) {
        detachLifecycleHandlers()
        detachLifecycleHandlers = null
      }

      if (user) {
        detachSettingsListener = onSnapshot(doc(db, 'users', user.uid, 'settings', 'default'), (settingsSnapshot) => {
          const settings = settingsSnapshot.data() as { theme?: UserSettings['theme'] } | undefined
          detachThemeListener?.()
          detachThemeListener = watchTheme(settings?.theme ?? getStoredTheme() ?? 'dark')
        }, (error) => {
          console.error('Unable to listen for the saved theme', error)
          detachThemeListener?.()
          detachThemeListener = watchTheme(getStoredTheme() ?? 'dark')
        })
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            void userService.setPresence(user.uid, true)
          } else {
            void userService.setOffline(user.uid)
          }
        }

        void userService.ensureUserDocument(user.uid, {
          email: user.email ?? '',
          displayName: user.displayName ?? 'New User',
          avatarUrl: user.photoURL ?? '',
        }).then(() => document.visibilityState === 'visible'
          ? userService.setPresence(user.uid, true)
          : userService.setOffline(user.uid)).catch((error) => {
          console.error('Unable to synchronize the Firebase user profile', error)
        })

        const markOffline = () => {
          void userService.setOffline(user.uid)
        }
        const markOnline = () => {
          void userService.setPresence(user.uid, true)
        }
        const presenceHeartbeat = window.setInterval(() => {
          if (document.visibilityState === 'visible') markOnline()
        }, 25_000)
        window.addEventListener('beforeunload', markOffline)
        window.addEventListener('pagehide', markOffline)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('pageshow', markOnline)

        detachLifecycleHandlers = () => {
          window.removeEventListener('beforeunload', markOffline)
          window.removeEventListener('pagehide', markOffline)
          window.removeEventListener('pageshow', markOnline)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.clearInterval(presenceHeartbeat)
        }
      }
      if (!user && !getStoredTheme()) detachThemeListener = watchTheme('dark')
      setLoading(false)
    })

    return () => {
      detachLifecycleHandlers?.()
      detachSettingsListener?.()
      detachThemeListener?.()
      unsubscribe()
    }
  }, [])

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function register(email: string, password: string, displayName: string, profile?: Partial<StudentProfile>) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    try {
      await updateProfile(user, { displayName })
      await userService.createUserDocument(user.uid, { email, displayName, ...profile })
    } catch (error) {
      try {
        await deleteUser(user)
      } catch (cleanupError) {
        console.error('Unable to roll back the incomplete account', cleanupError)
      }
      throw error
    }
  }

  async function logout() {
    if (auth.currentUser) {
      await userService.setOffline(auth.currentUser.uid)
    }
    await signOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    const signedInUser = result.user
    await userService.ensureUserDocument(signedInUser.uid, {
      email: signedInUser.email ?? '',
      displayName: signedInUser.displayName ?? 'New User',
      avatarUrl: signedInUser.photoURL ?? '',
    })
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, resetPassword, loginWithGoogle }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
