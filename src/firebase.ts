import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCpjeNkq4GXRhypT369jn1KN_mo0kiSF84",
  authDomain: "novatalk-d6c58.firebaseapp.com",
  databaseURL: "https://novatalk-d6c58-default-rtdb.firebaseio.com",
  projectId: "novatalk-d6c58",
  storageBucket: "novatalk-d6c58.firebasestorage.app",
  messagingSenderId: "339194194463",
  appId: "1:339194194463:web:f86f894f8724a17017832a",
  measurementId: "G-D94RF1TVW8"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)
export const googleProvider = new GoogleAuthProvider()

export default app
