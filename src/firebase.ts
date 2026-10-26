import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCpjeNkq4GXRhypT369jn1KN_mo0kiSF84',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'novatalk-d6c58.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://novatalk-d6c58-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'novatalk-d6c58',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'novatalk-d6c58.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '339194194463',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:339194194463:web:f86f894f8724a17017832a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-D94RF1TVW8',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
})
export const rtdb = getDatabase(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export default app
