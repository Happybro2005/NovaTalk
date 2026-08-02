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
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { userService } from '../services/userService'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
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

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (detachLifecycleHandlers) {
        detachLifecycleHandlers()
        detachLifecycleHandlers = null
      }

      if (user) {
        userService.setPresence(user.uid, true)

        const markOffline = () => {
          void userService.setOffline(user.uid)
        }
        const markOnline = () => {
          void userService.setPresence(user.uid, true)
        }
        window.addEventListener('beforeunload', markOffline)
        window.addEventListener('pagehide', markOffline)
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            markOnline()
          }
        })

        detachLifecycleHandlers = () => {
          window.removeEventListener('beforeunload', markOffline)
          window.removeEventListener('pagehide', markOffline)
          window.removeEventListener('visibilitychange', markOnline)
        }
      }
      setLoading(false)
    })

    return () => {
      detachLifecycleHandlers?.()
      unsubscribe()
    }
  }, [])

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function register(email: string, password: string, displayName: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
    await userService.createUserDocument(user.uid, { email, displayName })
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
    await signInWithPopup(auth, googleProvider)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout, resetPassword, loginWithGoogle }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
